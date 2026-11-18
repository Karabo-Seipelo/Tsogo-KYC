import { afterEach, expect, test, vi } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { POST as createSession } from "../route";
import { GET as readStatus } from "../status/route";
import { POST } from "./route";

afterEach(() => {
  vi.useRealTimers();
});

test("R-06.3 I'm still here extends a session by its window", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  const id = await sessionId();
  vi.advanceTimersByTime(10_000);

  const response = await POST(stay(id));
  const body: unknown = await response.json();

  expect(response.status).toBe(200);
  expect(body).toEqual({ expiresAt: "2026-01-01T00:15:10.000Z" });
  expect(JSON.stringify(body)).not.toContain(id);
  await expect(createMemoryStore().get(`session:${id}`)).resolves.toMatchObject(
    { expiresAt: "2026-01-01T00:15:10.000Z" },
  );
});

test("R-06.3 I'm still here extends a 1-minute session by one minute", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  const id = await sessionId("http://localhost:3000/api/session?ttl=1");
  vi.advanceTimersByTime(10_000);

  const response = await POST(stay(id));

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    expiresAt: "2026-01-01T00:01:10.000Z",
  });
});

test("R-06.4 ending the session reports expired, drops the QR, and discards captures", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  const id = await sessionId();
  const store = createMemoryStore();
  const existing = await store.get(`session:${id}`);
  if (!isRecord(existing) || typeof existing.handoffToken !== "string") {
    throw new Error("session was not stored");
  }
  await store.set(
    `session:${id}`,
    { ...existing, thumbnail: "document", selfieThumbnail: "selfie" },
    60,
  );

  const response = await POST(stay(id, { end: true }));
  const status = await readStatus(stay(id));
  const stored = await store.get(`session:${id}`);

  expect(response.status).toBe(200);
  expect(await status.json()).toMatchObject({ expired: true });
  await expect(
    store.get(`handoff:${existing.handoffToken}`),
  ).resolves.toBeNull();
  expect(stored).not.toHaveProperty("thumbnail");
  expect(stored).not.toHaveProperty("selfieThumbnail");
  expect(JSON.stringify(stored)).not.toContain(id);
});

test("AC-02.14 stay without a cookie is 401", async () => {
  const response = await POST(stay());

  expect(response.status).toBe(401);
});

test("R-02.13 a mismatched Origin does not extend the session", async () => {
  const id = await sessionId();
  const before = await createMemoryStore().get(`session:${id}`);

  const response = await POST(
    stay(id, undefined, { origin: "https://evil.example" }),
  );

  expect(response.status).toBe(403);
  await expect(createMemoryStore().get(`session:${id}`)).resolves.toEqual(
    before,
  );
});

async function sessionId(url = "http://localhost:3000/api/session") {
  const created = await createSession(
    new Request(url, {
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
    }),
  );
  const header = created.headers
    .getSetCookie()
    .find((line) => line.toLowerCase().startsWith("session="));
  if (!header) {
    throw new Error("session cookie was not set");
  }
  return header.split(";")[0]?.slice("session=".length) ?? "";
}

function stay(
  session?: string,
  body?: { end: true },
  headers: { origin?: string } = {},
) {
  const requestHeaders = new Headers({
    host: "localhost:3000",
    origin: headers.origin ?? "http://localhost:3000",
  });
  if (session) {
    requestHeaders.set("cookie", `session=${session}`);
  }
  if (body) {
    requestHeaders.set("content-type", "application/json");
  }
  return new Request("http://localhost:3000/api/session/stay", {
    method: "POST",
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
