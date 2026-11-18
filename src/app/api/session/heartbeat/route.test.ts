import { afterEach, expect, test, vi } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { POST as createSession } from "../route";
import { GET as readStatus } from "../status/route";
import { POST } from "./route";

const seenAt = "2026-01-01T00:00:00.000Z";

afterEach(() => {
  vi.useRealTimers();
});

test("R-02.7 a heartbeat stores lastSeen and leaves the step", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(seenAt));
  const id = await sessionId();
  const store = createMemoryStore();
  const existing = await store.get(`session:${id}`);
  await store.set(
    `session:${id}`,
    { ...record(existing), step: "documentUpload" },
    15 * 60,
  );

  const response = await POST(heartbeat(id));

  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "documentUpload",
    lastSeen: seenAt,
  });
});

test("R-02.7 status is connected for 30 seconds and disconnected after that", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(seenAt));
  const id = await sessionId();

  expect((await POST(heartbeat(id))).status).toBe(204);
  expect(
    await readStatus(statusRequest(id)).then((response) => response.json()),
  ).toEqual(
    expect.objectContaining({
      phoneConnected: true,
      lastSeen: seenAt,
    }),
  );

  vi.advanceTimersByTime(30_000);
  expect(
    await readStatus(statusRequest(id)).then((response) => response.json()),
  ).toMatchObject({
    phoneConnected: true,
    lastSeen: seenAt,
  });

  vi.advanceTimersByTime(1);
  expect(
    await readStatus(statusRequest(id)).then((response) => response.json()),
  ).toMatchObject({
    phoneConnected: false,
    lastSeen: seenAt,
  });
});

test("AC-02.14 heartbeat without a cookie is 401", async () => {
  const response = await POST(heartbeat());

  expect(response.status).toBe(401);
  expect(await response.text()).toBe("");
});

test("R-02.13 a mismatched Origin stores no lastSeen", async () => {
  const id = await sessionId();
  const store = createMemoryStore();

  const response = await POST(
    heartbeat(id, { origin: "https://evil.example" }),
  );

  expect(response.status).toBe(403);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
  });
  expect(JSON.stringify(await store.get(`session:${id}`))).not.toContain(
    "lastSeen",
  );
});

test("AC-08.6 a heartbeat logs one line and leaves the session id out", async () => {
  const id = await sessionId();
  const store = createMemoryStore();
  const existing = await store.get(`session:${id}`);
  await store.set(
    `session:${id}`,
    { ...record(existing), step: "documentUpload" },
    15 * 60,
  );
  const lines: unknown[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((line: unknown) => {
    lines.push(line);
  });

  try {
    const response = await POST(heartbeat(id));
    expect(response.status).toBe(204);
  } finally {
    spy.mockRestore();
  }

  expect(lines).toEqual([
    {
      route: "/api/session/heartbeat",
      status: 204,
      duration: expect.any(Number),
      step: "documentUpload",
      errorCode: null,
    },
  ]);
  expect(JSON.stringify(lines)).not.toContain(id);
});

async function sessionId() {
  const response = await createSession(
    new Request("http://localhost:3000/api/session", {
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
    }),
  );
  const header = response.headers
    .getSetCookie()
    .find((line) => line.toLowerCase().startsWith("session="));
  if (!header) {
    throw new Error("session cookie was not set");
  }
  return header.split(";")[0]?.slice("session=".length) ?? "";
}

function heartbeat(session?: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/session/heartbeat", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...(session ? { cookie: `session=${session}` } : {}),
      ...headers,
    },
  });
}

function statusRequest(session: string) {
  return new Request("http://localhost:3000/api/session/status", {
    headers: { cookie: `session=${session}` },
  });
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error("session was not stored");
}
