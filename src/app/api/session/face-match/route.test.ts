import { expect, test } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { POST as createSession } from "../route";
import { POST } from "./route";

test("AC-02.14 face match without a cookie is 401", async () => {
  const response = await POST(faceMatch());

  expect(response.status).toBe(401);
});

test("AC-02.13 a mismatched Origin records no face match", async () => {
  const id = await sessionId();
  const store = createMemoryStore();

  const response = await POST(
    faceMatch(id, { origin: "https://evil.example" }),
  );

  expect(response.status).toBe(403);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
  });
  expect(JSON.stringify(await store.get(`session:${id}`))).not.toContain(
    "match",
  );
});

test("R-04.3 a passing face match returns the result and keeps confidence off the session", async () => {
  const id = await sessionId();
  const store = createMemoryStore();

  const response = await POST(faceMatch(id));
  const body: unknown = await response.json();
  const stored = await store.get(`session:${id}`);

  expect(response.status).toBe(200);
  expect(body).toEqual({ match: true, confidence: 0.99 });
  expect(JSON.stringify(body)).not.toContain(id);
  expect(stored).toMatchObject({
    step: "idle",
    handoffToken: expect.any(String),
    match: true,
  });
  expect(JSON.stringify(stored)).not.toContain("confidence");
  expect(JSON.stringify(stored)).not.toContain("0.99");
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

function faceMatch(session?: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/session/face-match", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...(session ? { cookie: `session=${session}` } : {}),
      ...headers,
    },
  });
}
