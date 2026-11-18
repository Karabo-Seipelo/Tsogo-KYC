import { afterEach, expect, test, vi } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { POST as createSession } from "../route";
import { GET as status } from "../status/route";
import { POST } from "./route";

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

test("AC-02.14 submit without a cookie is 401", async () => {
  const response = await POST(submit());

  expect(response.status).toBe(401);
});

test("AC-02.13 a mismatched Origin leaves the session idle", async () => {
  const id = await sessionId();
  const store = createMemoryStore();

  const response = await POST(submit(id, { origin: "https://evil.example" }));

  expect(response.status).toBe(403);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
  });
});

test("R-05.4 submit returns 202 and moves the session to processing", async () => {
  vi.useFakeTimers();
  const id = await sessionId();
  const store = createMemoryStore();

  const response = await POST(submit(id));
  const body: unknown = await response.json();

  expect(response.status).toBe(202);
  expect(body).toEqual({ step: "processing" });
  expect(JSON.stringify(body)).not.toContain(id);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "processing",
    handoffToken: expect.any(String),
  });
});

test("AC-05.6 the passing result follows between 3 and 8 seconds and closes the handoff", async () => {
  vi.useFakeTimers();
  const id = await sessionId();
  const store = createMemoryStore();
  const created = await store.get(`session:${id}`);
  const handoffToken = record(created).handoffToken;

  await POST(submit(id));
  await vi.advanceTimersByTimeAsync(2_999);

  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "processing",
  });
  await expect(store.get(`handoff:${String(handoffToken)}`)).resolves.toEqual({
    sessionId: id,
  });

  await vi.advanceTimersByTimeAsync(5_001);
  const poll = await status(submit(id));
  const body: unknown = await poll.json();

  expect(poll.status).toBe(200);
  expect(body).toMatchObject({ step: "complete", handoffExpired: true });
  expect(JSON.stringify(body)).not.toContain(id);
  await expect(
    store.get(`handoff:${String(handoffToken)}`),
  ).resolves.toBeNull();
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "complete",
  });
});

test("AC-06.5 ?fail=reject stays in processing, then rejects with no check detail", async () => {
  vi.useFakeTimers();
  const id = await sessionId("http://localhost:3000/api/session?fail=reject");
  const store = createMemoryStore();

  const response = await POST(submit(id));

  expect(response.status).toBe(202);
  expect(await response.json()).toEqual({ step: "processing" });
  await vi.advanceTimersByTimeAsync(2_999);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "processing",
  });

  await vi.advanceTimersByTimeAsync(5_001);
  const poll = await status(submit(id));
  const body: unknown = await poll.json();
  const stored = await store.get(`session:${id}`);

  expect(poll.status).toBe(200);
  expect(body).toMatchObject({ step: "error" });
  expect(stored).toMatchObject({ step: "error", outcome: "rejected" });
  const revealed = JSON.stringify(body) + JSON.stringify(stored);
  expect(revealed).not.toMatch(
    /blurry|glare|cropped|fraud|confidence|corners|readable|notExpired/i,
  );
  expect(JSON.stringify(body)).not.toContain(id);
});

async function sessionId(url = "http://localhost:3000/api/session") {
  const response = await createSession(
    new Request(url, {
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

function submit(session?: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/session/submit", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...(session ? { cookie: `session=${session}` } : {}),
      ...headers,
    },
  });
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error("session was not stored");
}
