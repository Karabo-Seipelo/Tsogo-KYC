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
    passingThumbStored,
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
    thumbnail: passingThumbStored,
    checks,
  });
  expect(JSON.stringify(stored)).not.toContain("full-size-photo");
});

test("AC-03.6 ?fail=document fails the first check and the retake passes", async () => {
  const id = await sessionId("http://localhost:3000/api/session?fail=document");

  const first = await POST(upload(id));
  const failed = (await first.json()) as {
    passed: boolean;
    checks: { id: string; passed: boolean }[];
  };

  expect(first.status).toBe(200);
  expect(failed.passed).toBe(false);
  expect(failed.checks.find((check) => check.id === "blurry")?.passed).toBe(
    false,
  );

  const second = await POST(upload(id));
  expect(second.status).toBe(200);
  expect(await second.json()).toMatchObject({ passed: true });
});

test("AC-11.2 a thumbnail that is not a JPEG is rejected and the stored thumbnail stays", async () => {
  const id = await sessionId();
  const store = createMemoryStore();
  await keepThumbnail(store, id);

  const response = await POST(
    upload(
      id,
      {},
      { thumbnail: new Blob(["not-a-jpeg"], { type: "image/jpeg" }) },
    ),
  );

  expect(response.status).toBe(400);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    thumbnail: "already-stored",
  });
  expect(JSON.stringify(await store.get(`session:${id}`))).not.toContain(
    "not-a-jpeg",
  );
});

test("AC-11.2 a JPEG larger than 150 KB is rejected and the stored thumbnail stays", async () => {
  const id = await sessionId();
  const store = createMemoryStore();
  await keepThumbnail(store, id);

  const response = await POST(
    upload(id, {}, { thumbnail: jpeg(150 * 1024 + 1) }),
  );

  expect(response.status).toBe(400);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    thumbnail: "already-stored",
  });
});

test("AC-11.2 a side other than front or back is rejected and the session stays", async () => {
  const id = await sessionId();
  const store = createMemoryStore();
  await keepThumbnail(store, id);

  const response = await POST(
    upload(id, {}, { side: "sideways", thumbnail: jpeg(32) }),
  );

  expect(response.status).toBe(400);
  const stored = await store.get(`session:${id}`);
  expect(stored).toMatchObject({ thumbnail: "already-stored" });
  expect(JSON.stringify(stored)).not.toContain("sideways");
});

test("AC-03.8 ?fail=upload fails three times and the next send succeeds", async () => {
  const id = await sessionId("http://localhost:3000/api/session?fail=upload");
  const store = createMemoryStore();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await POST(upload(id));
    expect(response.status).toBe(503);
  }
  expect(JSON.stringify(await store.get(`session:${id}`))).not.toContain(
    passingThumbStored,
  );

  const recovered = await POST(upload(id));
  expect(recovered.status).toBe(200);
  expect(await recovered.json()).toMatchObject({ passed: true });
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

async function keepThumbnail(
  store: ReturnType<typeof createMemoryStore>,
  id: string,
) {
  const existing = await store.get(`session:${id}`);
  await store.set(
    `session:${id}`,
    { ...record(existing), thumbnail: "already-stored" },
    15 * 60,
  );
}

const passingThumb = new Uint8Array(32);
passingThumb[0] = 0xff;
passingThumb[1] = 0xd8;
passingThumb[2] = 0xff;
const passingThumbStored = Buffer.from(passingThumb).toString("base64");

function jpeg(bytes: number) {
  const data = new Uint8Array(bytes);
  data[0] = 0xff;
  data[1] = 0xd8;
  data[2] = 0xff;
  return new Blob([data], { type: "image/jpeg" });
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error("session was not stored");
}

function upload(
  session?: string,
  headers: Record<string, string> = {},
  parts: { side?: string; thumbnail?: Blob } = {},
) {
  const form = new FormData();
  form.set("side", parts.side ?? "front");
  form.set(
    "image",
    new Blob(["full-size-photo"], { type: "image/jpeg" }),
    "image.jpg",
  );
  form.set(
    "thumbnail",
    parts.thumbnail ?? new Blob([passingThumb], { type: "image/jpeg" }),
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
