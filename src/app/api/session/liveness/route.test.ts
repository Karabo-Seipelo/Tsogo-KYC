import { expect, test } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { POST as createSession } from "../route";
import { POST } from "./route";

test("AC-02.14 liveness without a cookie is 401", async () => {
  const response = await POST(liveness());

  expect(response.status).toBe(401);
});

test("AC-02.13 a mismatched Origin records no liveness result", async () => {
  const id = await sessionId();
  const store = createMemoryStore();

  const response = await POST(liveness(id, { origin: "https://evil.example" }));

  expect(response.status).toBe(403);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
  });
  expect(JSON.stringify(await store.get(`session:${id}`))).not.toContain(
    "livenessPassed",
  );
});

test("R-04.3 a passing liveness check returns passed and records it", async () => {
  const id = await sessionId();
  const store = createMemoryStore();

  const response = await POST(liveness(id));
  const body: unknown = await response.json();
  const stored = await store.get(`session:${id}`);

  expect(response.status).toBe(200);
  expect(body).toEqual({ passed: true });
  expect(JSON.stringify(body)).not.toContain(id);
  expect(stored).toMatchObject({
    step: "idle",
    handoffToken: expect.any(String),
    livenessPassed: true,
  });
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

function liveness(session?: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/session/liveness", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...(session ? { cookie: `session=${session}` } : {}),
      ...headers,
    },
  });
}
