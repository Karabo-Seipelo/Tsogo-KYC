import { afterEach, expect, test, vi } from "vitest";
import { logRequest } from "./requestLog";

const idNumber = "8001015009087";
const sessionId = "session-id-should-stay-out";
const image = "data:image/jpeg;base64,AAAA";

afterEach(() => {
  vi.useRealTimers();
});

test("AC-08.6 one request writes one line with route, status, duration, step and error code", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  const response = new Response(null, { status: 200 });

  const lines = await recorded(() =>
    logRequest(
      new Request("http://localhost:3000/api/session"),
      async () => {
        vi.advanceTimersByTime(15);
        return response;
      },
      { step: "idle", errorCode: null },
    ),
  );

  expect(lines).toEqual([
    {
      route: "/api/session",
      status: 200,
      duration: 15,
      step: "idle",
      errorCode: null,
    },
  ]);
});

test("AC-08.6 the log line leaves out the session, the id number and the image", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  const lines = await recorded(() =>
    logRequest(
      new Request(
        `http://localhost:3000/api/session/status?idNumber=${idNumber}`,
        { headers: { cookie: `session=${sessionId}` } },
      ),
      () =>
        Response.json(
          { name: "Amina", image, error: "SESSION_EXPIRED" },
          { status: 401 },
        ),
      { step: null, errorCode: "SESSION_EXPIRED" },
    ),
  );

  expect(lines).toEqual([
    {
      route: "/api/session/status",
      status: 401,
      duration: 0,
      step: null,
      errorCode: "SESSION_EXPIRED",
    },
  ]);
  const text = JSON.stringify(lines);
  expect(text).not.toContain(idNumber);
  expect(text).not.toContain(sessionId);
  expect(text).not.toContain("Amina");
  expect(text).not.toContain(image);
});

async function recorded(run: () => Promise<unknown>) {
  const lines: unknown[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((line: unknown) => {
    lines.push(line);
  });
  try {
    await run();
  } finally {
    spy.mockRestore();
  }
  return lines;
}
