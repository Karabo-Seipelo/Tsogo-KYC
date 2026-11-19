import { expect, test } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { POST as createSession } from "../route";
import { POST } from "./route";

test("AC-02.14 selfie upload without a cookie is 401", async () => {
  const response = await POST(selfie());

  expect(response.status).toBe(401);
});

test("AC-02.13 a mismatched Origin stores no selfie", async () => {
  const id = await sessionId();
  const store = createMemoryStore();

  const response = await POST(selfie(id, { origin: "https://evil.example" }));

  expect(response.status).toBe(403);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
  });
  expect(JSON.stringify(await store.get(`session:${id}`))).not.toContain(
    passingThumbnail,
  );
});

test("AC-11.2 a selfie thumbnail that is not a JPEG is rejected and the stored selfie stays", async () => {
  const id = await sessionId();
  const store = createMemoryStore();
  await keepSelfie(store, id);

  const response = await POST(
    selfie(id, {}, new Blob(["not-a-jpeg"], { type: "image/jpeg" })),
  );

  expect(response.status).toBe(400);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    selfieThumbnail: "already-stored",
  });
  expect(JSON.stringify(await store.get(`session:${id}`))).not.toContain(
    "not-a-jpeg",
  );
});

test("AC-11.2 a selfie JPEG larger than 150 KB is rejected and the stored selfie stays", async () => {
  const id = await sessionId();
  const store = createMemoryStore();
  await keepSelfie(store, id);

  const response = await POST(selfie(id, {}, jpeg(150 * 1024 + 1)));

  expect(response.status).toBe(400);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    selfieThumbnail: "already-stored",
  });
});

test("R-04.3 a passing selfie stores the thumbnail only", async () => {
  const id = await sessionId();
  const store = createMemoryStore();
  const existing = await store.get(`session:${id}`);
  await store.set(
    `session:${id}`,
    { ...record(existing), thumbnail: "document-thumb" },
    15 * 60,
  );

  const response = await POST(selfie(id));
  const body: unknown = await response.json();
  const stored = await store.get(`session:${id}`);

  expect(response.status).toBe(200);
  expect(body).toEqual({ ok: true });
  expect(JSON.stringify(body)).not.toContain(id);
  expect(stored).toMatchObject({
    step: "idle",
    handoffToken: expect.any(String),
    thumbnail: "document-thumb",
    selfieThumbnail: passingThumbnail,
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

function selfie(
  session?: string,
  headers: Record<string, string> = {},
  thumbnail = jpeg(32),
) {
  const form = new FormData();
  form.set(
    "image",
    new Blob(["full-size-photo"], { type: "image/jpeg" }),
    "image.jpg",
  );
  form.set("thumbnail", thumbnail, "thumb.jpg");
  return new Request("http://localhost:3000/api/session/selfie", {
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

async function keepSelfie(
  store: ReturnType<typeof createMemoryStore>,
  id: string,
) {
  const existing = await store.get(`session:${id}`);
  await store.set(
    `session:${id}`,
    { ...record(existing), selfieThumbnail: "already-stored" },
    15 * 60,
  );
}

const passingThumbnail = Buffer.from(jpegBytes(32)).toString("base64");

function jpeg(bytes: number) {
  return new Blob([jpegBytes(bytes)], { type: "image/jpeg" });
}

function jpegBytes(size: number) {
  const data = new Uint8Array(size);
  data[0] = 0xff;
  data[1] = 0xd8;
  data[2] = 0xff;
  return data;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error("session was not stored");
}
