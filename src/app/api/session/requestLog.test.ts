import { afterEach, expect, test, vi } from "vitest";
import { POST as createSession } from "./route";
import { POST as uploadDocument } from "./document/route";
import { POST as matchFace } from "./face-match/route";
import { POST as recordLiveness } from "./liveness/route";
import { POST as uploadSelfie } from "./selfie/route";
import { GET as readStatus } from "./status/route";
import { POST as submitSession } from "./submit/route";

const thumbnail = "thumb-bytes-must-stay-out";

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

test("AC-08.6 creating a session logs one line and leaves the session id out", async () => {
  const { response, lines } = await logged(() =>
    createSession(jsonRequest("/api/session")),
  );
  const id = sessionId(response);

  expect(response.status).toBe(200);
  expectRequestLog(lines, {
    route: "/api/session",
    status: 200,
    step: "idle",
  });
  expect(JSON.stringify(lines)).not.toContain(id);
});

test("AC-08.6 a rejected create still logs one line", async () => {
  const { response, lines } = await logged(() =>
    createSession(
      jsonRequest("/api/session", { origin: "https://evil.example" }),
    ),
  );

  expect(response.status).toBe(403);
  expectRequestLog(lines, {
    route: "/api/session",
    status: 403,
    step: null,
  });
});

test("AC-08.6 status without a cookie logs one line", async () => {
  const { response, lines } = await logged(() =>
    readStatus(jsonRequest("/api/session/status")),
  );

  expect(response.status).toBe(401);
  expectRequestLog(lines, {
    route: "/api/session/status",
    status: 401,
    step: null,
  });
});

test("AC-08.6 status logs the stored step and leaves the session id out", async () => {
  const id = await sessionId(await createSession(jsonRequest("/api/session")));
  const { response, lines } = await logged(() =>
    readStatus(jsonRequest("/api/session/status", { cookie: `session=${id}` })),
  );

  expect(response.status).toBe(200);
  expectRequestLog(lines, {
    route: "/api/session/status",
    status: 200,
    step: "idle",
  });
  expect(JSON.stringify(lines)).not.toContain(id);
});

test("AC-08.6 a document upload logs the step and leaves the photo out", async () => {
  const id = await sessionId(await createSession(jsonRequest("/api/session")));
  const { response, lines } = await logged(() =>
    uploadDocument(documentRequest(id)),
  );

  expect(response.status).toBe(200);
  expectRequestLog(lines, {
    route: "/api/session/document",
    status: 200,
    step: "idle",
  });
  const text = JSON.stringify(lines);
  expect(text).not.toContain(id);
  expect(text).not.toContain(thumbnail);
});

test("AC-08.6 a document upload without a cookie logs one line", async () => {
  const { response, lines } = await logged(() =>
    uploadDocument(documentRequest()),
  );

  expect(response.status).toBe(401);
  expectRequestLog(lines, {
    route: "/api/session/document",
    status: 401,
    step: null,
  });
  expect(JSON.stringify(lines)).not.toContain(thumbnail);
});

test("AC-08.6 a selfie upload logs the step and leaves the photo out", async () => {
  const id = await sessionId(await createSession(jsonRequest("/api/session")));
  const { response, lines } = await logged(() =>
    uploadSelfie(selfieRequest(id)),
  );

  expect(response.status).toBe(200);
  expectRequestLog(lines, {
    route: "/api/session/selfie",
    status: 200,
    step: "idle",
  });
  const text = JSON.stringify(lines);
  expect(text).not.toContain(id);
  expect(text).not.toContain(thumbnail);
});

test("AC-08.6 liveness logs the stored step and leaves the session id out", async () => {
  const id = await sessionId(await createSession(jsonRequest("/api/session")));
  const { response, lines } = await logged(() =>
    recordLiveness(
      jsonRequest("/api/session/liveness", { cookie: `session=${id}` }),
    ),
  );

  expect(response.status).toBe(200);
  expectRequestLog(lines, {
    route: "/api/session/liveness",
    status: 200,
    step: "idle",
  });
  expect(JSON.stringify(lines)).not.toContain(id);
});

test("AC-08.6 face match logs the stored step and leaves the session id out", async () => {
  const id = await sessionId(await createSession(jsonRequest("/api/session")));
  const { response, lines } = await logged(() =>
    matchFace(
      jsonRequest("/api/session/face-match", { cookie: `session=${id}` }),
    ),
  );

  expect(response.status).toBe(200);
  expectRequestLog(lines, {
    route: "/api/session/face-match",
    status: 200,
    step: "idle",
  });
  expect(JSON.stringify(lines)).not.toContain(id);
});

test("AC-08.6 submit logs the processing step and leaves the session id out", async () => {
  vi.useFakeTimers();
  const id = await sessionId(await createSession(jsonRequest("/api/session")));
  const { response, lines } = await logged(() =>
    submitSession(
      jsonRequest("/api/session/submit", { cookie: `session=${id}` }),
    ),
  );

  expect(response.status).toBe(202);
  expectRequestLog(lines, {
    route: "/api/session/submit",
    status: 202,
    step: "processing",
  });
  expect(JSON.stringify(lines)).not.toContain(id);
});

test("AC-08.6 submit without a cookie logs one line", async () => {
  const { response, lines } = await logged(() =>
    submitSession(jsonRequest("/api/session/submit")),
  );

  expect(response.status).toBe(401);
  expectRequestLog(lines, {
    route: "/api/session/submit",
    status: 401,
    step: null,
  });
});

function expectRequestLog(
  lines: unknown[],
  expected: { route: string; status: number; step: string | null },
) {
  expect(lines).toHaveLength(1);
  expect(lines[0]).toEqual({
    route: expected.route,
    status: expected.status,
    duration: expect.any(Number),
    step: expected.step,
    errorCode: null,
  });
  const duration = (lines[0] as { duration: number }).duration;
  expect(duration).toBeGreaterThanOrEqual(0);
}

async function logged(run: () => Promise<Response>) {
  const lines: unknown[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((line: unknown) => {
    lines.push(line);
  });
  try {
    return { response: await run(), lines };
  } finally {
    spy.mockRestore();
  }
}

function jsonRequest(path: string, headers: Record<string, string> = {}) {
  return new Request(`http://localhost:3000${path}`, {
    method: path.endsWith("/status") ? "GET" : "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...headers,
    },
  });
}

function jpegThumbnail() {
  const marker = new TextEncoder().encode(thumbnail);
  const data = new Uint8Array(3 + marker.length);
  data[0] = 0xff;
  data[1] = 0xd8;
  data[2] = 0xff;
  data.set(marker, 3);
  return new Blob([data], { type: "image/jpeg" });
}

function documentRequest(session?: string) {
  const form = new FormData();
  form.set("side", "front");
  form.set("thumbnail", jpegThumbnail(), "thumb.jpg");
  return new Request("http://localhost:3000/api/session/document", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...(session ? { cookie: `session=${session}` } : {}),
    },
    body: form,
  });
}

function selfieRequest(session: string) {
  const form = new FormData();
  form.set("thumbnail", jpegThumbnail(), "thumb.jpg");
  return new Request("http://localhost:3000/api/session/selfie", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      cookie: `session=${session}`,
    },
    body: form,
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
