import { afterEach, expect, test, vi } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { POST as createSession } from "../route";
import { POST } from "./route";

afterEach(() => {
  vi.useRealTimers();
});

test("R-02.8 a new token replaces the old one and the step stays", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  const { id, token } = await issuedToken();
  const store = createMemoryStore();
  const existing = await store.get(`session:${id}`);
  await store.set(
    `session:${id}`,
    { ...record(existing), step: "documentUpload" },
    15 * 60,
  );

  const response = await POST(refresh(id));
  const body = (await response.json()) as {
    handoffToken: string;
    handoffExpiresAt: string;
  };

  expect(response.status).toBe(200);
  expect(Object.keys(body).sort()).toEqual([
    "handoffExpiresAt",
    "handoffToken",
  ]);
  expect(body.handoffToken).not.toBe(token);
  expect(tokenBytes(body.handoffToken)).toBeGreaterThanOrEqual(16);
  expect(Date.parse(body.handoffExpiresAt)).toBe(Date.now() + 10 * 60 * 1000);
  expect(JSON.stringify(body)).not.toContain(id);
  expect(response.headers.getSetCookie()).toEqual([]);
  await expect(store.get(`handoff:${token}`)).resolves.toBeNull();
  await expect(store.get(`handoff:${body.handoffToken}`)).resolves.toEqual({
    sessionId: id,
  });
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "documentUpload",
    handoffToken: body.handoffToken,
  });
});

test("AC-02.14 refresh without a cookie is 401", async () => {
  const response = await POST(refresh());

  expect(response.status).toBe(401);
  expect(await response.text()).toBe("");
});

test("R-02.13 a mismatched Origin leaves the old token", async () => {
  const { id, token } = await issuedToken();
  const store = createMemoryStore();

  const response = await POST(refresh(id, { origin: "https://evil.example" }));

  expect(response.status).toBe(403);
  await expect(store.get(`handoff:${token}`)).resolves.toEqual({
    sessionId: id,
  });
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
    handoffToken: token,
  });
});

test("AC-08.6 a new token logs one line and leaves the session id out", async () => {
  const { id } = await issuedToken();
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
    const response = await POST(refresh(id));
    expect(response.status).toBe(200);
  } finally {
    spy.mockRestore();
  }

  expect(lines).toEqual([
    {
      route: "/api/session/handoff",
      status: 200,
      duration: expect.any(Number),
      step: "documentUpload",
      errorCode: null,
    },
  ]);
  expect(JSON.stringify(lines)).not.toContain(id);
});

async function issuedToken() {
  const response = await createSession(
    new Request("http://localhost:3000/api/session", {
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
    }),
  );
  const body = (await response.json()) as { handoffToken: string };
  return { id: sessionId(response), token: body.handoffToken };
}

function refresh(session?: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/session/handoff", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...(session ? { cookie: `session=${session}` } : {}),
      ...headers,
    },
  });
}

function sessionId(response: Response) {
  const header = response.headers
    .getSetCookie()
    .find((line) => line.toLowerCase().startsWith("session="));
  if (!header) {
    throw new Error("session cookie was not set");
  }
  return header.split(";")[0]?.slice("session=".length) ?? "";
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error("session was not stored");
}

function tokenBytes(token: string) {
  if (!/^[0-9a-f]+$/i.test(token) || token.length % 2 !== 0) {
    return 0;
  }
  return token.length / 2;
}
