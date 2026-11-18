import { afterEach, expect, test, vi } from "vitest";
import { createMemoryStore } from "../../../lib/store/memoryStore";
import { POST } from "./route";

afterEach(() => {
  vi.useRealTimers();
});

test("AC-02.13 a mismatched Origin is rejected and sets no cookie", async () => {
  const response = await POST(
    request("http://localhost:3000/api/session", {
      host: "localhost:3000",
      origin: "https://evil.example",
    }),
  );

  expect(response.status).toBe(403);
  expect(response.headers.getSetCookie()).toEqual([]);
});

test("AC-02.13 a missing Origin is rejected", async () => {
  const response = await POST(
    request("http://localhost:3000/api/session", { host: "localhost:3000" }),
  );

  expect(response.status).toBe(403);
  expect(response.headers.getSetCookie()).toEqual([]);
});

test("AC-02.13 the session cookie is host-only on plain HTTP", async () => {
  const response = await POST(
    request("http://localhost:3000/api/session", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    }),
  );
  const cookie = sessionCookie(response);

  expect(response.status).toBe(200);
  expect(cookie.attributes.has("httponly")).toBe(true);
  expect(cookie.attributes.get("samesite")?.toLowerCase()).toBe("lax");
  expect(cookie.attributes.get("path")).toBe("/");
  expect(cookie.attributes.has("domain")).toBe(false);
  expect(cookie.attributes.has("secure")).toBe(false);
});

test("AC-02.13 the cookie is Secure when the forwarded protocol is HTTPS", async () => {
  const response = await POST(
    request("http://internal:3000/api/session", {
      host: "internal:3000",
      origin: "https://preview.example",
      "x-forwarded-host": "preview.example",
      "x-forwarded-proto": "https",
    }),
  );

  expect(response.status).toBe(200);
  expect(sessionCookie(response).attributes.has("secure")).toBe(true);
});

test("AC-02.14 the session id is only in the cookie", async () => {
  const response = await POST(
    request("http://localhost:3000/api/session", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    }),
  );
  const body: unknown = await response.json();
  const id = sessionCookie(response).value;

  expect(Object.keys(body as object).sort()).toEqual([
    "handoffExpiresAt",
    "handoffToken",
  ]);
  expect(JSON.stringify(body)).not.toContain(id);
  expect(response.headers.get("location") ?? "").not.toContain(id);
  expect(response.url).not.toContain(id);
});

test("POST /api/session stores the session for 15 minutes and the handoff for 10", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  const response = await POST(
    request("http://localhost:3000/api/session", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    }),
  );
  const body = (await response.json()) as {
    handoffToken: string;
    handoffExpiresAt: string;
  };
  const id = sessionCookie(response).value;
  const store = createMemoryStore();

  expect(Date.parse(body.handoffExpiresAt)).toBe(Date.now() + 10 * 60 * 1000);
  expect(randomBytes(body.handoffToken)).toBeGreaterThanOrEqual(16);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
  });
  await expect(store.get(`handoff:${body.handoffToken}`)).resolves.toEqual({
    sessionId: id,
  });

  vi.advanceTimersByTime(10 * 60 * 1000);
  await expect(store.get(`handoff:${body.handoffToken}`)).resolves.toBeNull();
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
  });

  vi.advanceTimersByTime(5 * 60 * 1000);
  await expect(store.get(`session:${id}`)).resolves.toBeNull();
});

function request(url: string, headers: Record<string, string>) {
  return new Request(url, { method: "POST", headers });
}

function sessionCookie(response: Response) {
  const header = response.headers
    .getSetCookie()
    .find((line) => line.toLowerCase().startsWith("session="));
  if (!header) {
    throw new Error("session cookie was not set");
  }
  const [pair, ...parts] = header.split(";").map((part) => part.trim());
  const attributes = new Map(
    parts.map((part) => {
      const [name, value] = part.split("=");
      return [name.toLowerCase(), value ?? ""] as const;
    }),
  );
  return { value: pair.slice("session=".length), attributes };
}

function randomBytes(token: string) {
  if (!/^[0-9a-f]+$/i.test(token) || token.length % 2 !== 0) {
    return 0;
  }
  return token.length / 2;
}
