import { afterEach, expect, test, vi } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { POST } from "../route";
import { GET } from "./route";

afterEach(() => {
  vi.useRealTimers();
});

test("AC-02.14 status without a cookie is 401", async () => {
  const response = await GET(statusRequest());

  expect(response.status).toBe(401);
});

test("AC-02.14 status with an unknown cookie is 401 and hides the id", async () => {
  const response = await GET(statusRequest("missing-session"));
  const body = await response.text();

  expect(response.status).toBe(401);
  expect(body).not.toContain("missing-session");
  expect(response.url).not.toContain("missing-session");
});

test("R-02.6 a new session reports its step and an open handoff", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  const created = await POST(
    new Request("http://localhost:3000/api/session", {
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
    }),
  );
  const id = sessionId(created);
  const response = await GET(statusRequest(id));
  const body: unknown = await response.json();

  expect(response.status).toBe(200);
  expect(body).toEqual({
    step: "idle",
    phoneConnected: false,
    lastSeen: null,
    checks: [],
    handoffExpired: false,
  });
  expect(JSON.stringify(body)).not.toContain(id);

  vi.advanceTimersByTime(10 * 60 * 1000);
  expect(await (await GET(statusRequest(id))).json()).toMatchObject({
    step: "idle",
    handoffExpired: true,
  });
});

test("R-02.6 status returns the stored step and checks", async () => {
  const store = createMemoryStore();
  const checks = [{ id: "readable", label: "Readable", passed: true }];
  await store.set(
    "session:abc",
    {
      step: "documentUpload",
      phoneConnected: false,
      lastSeen: "2026-01-01T00:00:00.000Z",
      checks,
      handoffToken: "token",
    },
    60,
  );
  await store.set("handoff:token", { sessionId: "abc" }, 60);

  const response = await GET(statusRequest("abc"));

  expect(await response.json()).toEqual({
    step: "documentUpload",
    phoneConnected: false,
    lastSeen: "2026-01-01T00:00:00.000Z",
    checks,
    handoffExpired: false,
  });
});

function statusRequest(session?: string) {
  const headers = new Headers();
  if (session) {
    headers.set("cookie", `session=${session}`);
  }
  return new Request("http://localhost:3000/api/session/status", { headers });
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
