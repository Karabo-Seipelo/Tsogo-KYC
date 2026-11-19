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

test("AC-11.4 the session cookie expires with the 15 minute window", async () => {
  const response = await POST(
    request("http://localhost:3000/api/session", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    }),
  );

  expect(sessionCookie(response).attributes.get("max-age")).toBe("900");
});

test("AC-11.4 ?ttl=1 sets the cookie Max-Age to 60 seconds", async () => {
  const response = await POST(
    request("http://localhost:3000/api/session?ttl=1", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    }),
  );

  expect(sessionCookie(response).attributes.get("max-age")).toBe("60");
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
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
  });

  vi.advanceTimersByTime(1000);
  await expect(store.get(`session:${id}`)).resolves.toBeNull();
});

test("R-06.6 a fail switch is stored on the session and kept out of the response", async () => {
  const response = await POST(
    request("http://localhost:3000/api/session?fail=document", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    }),
  );
  const body: unknown = await response.json();
  const id = sessionCookie(response).value;

  expect(response.status).toBe(200);
  expect(body).not.toHaveProperty("fail");
  await expect(createMemoryStore().get(`session:${id}`)).resolves.toMatchObject(
    {
      step: "idle",
      fail: "document",
    },
  );
});

test("R-06.6 each recognised fail switch is stored as given", async () => {
  for (const fail of [
    "upload",
    "upload:always",
    "document:always",
    "match",
    "match:always",
    "reject",
  ]) {
    const response = await POST(
      request(`http://localhost:3000/api/session?fail=${fail}`, {
        host: "localhost:3000",
        origin: "http://localhost:3000",
      }),
    );
    const id = sessionCookie(response).value;

    await expect(
      createMemoryStore().get(`session:${id}`),
    ).resolves.toMatchObject({ fail });
  }
});

test("R-06.6 ttl=1 is stored with the fail switch", async () => {
  const response = await POST(
    request("http://localhost:3000/api/session?fail=reject&ttl=1", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    }),
  );
  const id = sessionCookie(response).value;

  await expect(createMemoryStore().get(`session:${id}`)).resolves.toMatchObject(
    {
      fail: "reject",
      ttl: 1,
    },
  );
});

test("R-06.6 an unknown switch is not stored", async () => {
  const response = await POST(
    request("http://localhost:3000/api/session?fail=nope&ttl=5", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    }),
  );
  const stored = await createMemoryStore().get(
    `session:${sessionCookie(response).value}`,
  );

  expect(stored).not.toHaveProperty("fail");
  expect(stored).not.toHaveProperty("ttl");
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
