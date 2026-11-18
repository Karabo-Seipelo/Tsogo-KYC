import { expect, test } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { POST as createSession } from "../route";
import { POST } from "./route";

const checks = [
  { id: "corners", label: "All four corners visible", passed: true },
  { id: "readable", label: "Text is readable", passed: true },
  { id: "notExpired", label: "Document hasn't expired", passed: true },
];

test("AC-02.14 document upload without a cookie is 401", async () => {
  const response = await POST(upload());

  expect(response.status).toBe(401);
});

test("AC-02.13 a mismatched Origin stores nothing", async () => {
  const id = await sessionId();
  const store = createMemoryStore();

  const response = await POST(upload(id, { origin: "https://evil.example" }));

  expect(response.status).toBe(403);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
  });
  expect(JSON.stringify(await store.get(`session:${id}`))).not.toContain(
    "thumb-bytes",
  );
});

test("R-03.5 a passing upload returns the checks and stores only the thumbnail", async () => {
  const id = await sessionId();
  const store = createMemoryStore();

  const response = await POST(upload(id));
  const body: unknown = await response.json();
  const stored = await store.get(`session:${id}`);

  expect(response.status).toBe(200);
  expect(body).toEqual({ passed: true, checks });
  expect(JSON.stringify(body)).not.toContain(id);
  expect(stored).toMatchObject({
    step: "idle",
    handoffToken: expect.any(String),
    side: "front",
    thumbnail: "thumb-bytes",
    checks,
  });
  expect(JSON.stringify(stored)).not.toContain("full-size-photo");
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

function upload(session?: string, headers: Record<string, string> = {}) {
  const form = new FormData();
  form.set("side", "front");
  form.set(
    "image",
    new Blob(["full-size-photo"], { type: "image/jpeg" }),
    "image.jpg",
  );
  form.set(
    "thumbnail",
    new Blob(["thumb-bytes"], { type: "image/jpeg" }),
    "thumb.jpg",
  );
  return new Request("http://localhost:3000/api/session/document", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...(session ? { cookie: `session=${session}` } : {}),
      ...headers,
    },
    body: form,
  });
}
