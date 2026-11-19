import { afterEach, expect, test, vi } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { POST as createSession } from "../../session/route";
import { POST } from "./route";

afterEach(() => {
  vi.useRealTimers();
});

test("R-02.5 a token is redeemed once, sets the phone cookie, and redirects to /m", async () => {
  const { id, token } = await issuedToken();
  const store = createMemoryStore();

  const response = await POST(redeem(token), params(token));
  const location = response.headers.get("location") ?? "";

  expect(response.status).toBe(303);
  expect(new URL(location, "http://localhost:3000").pathname).toBe("/m");
  expect(location).not.toContain(id);
  expect(await response.text()).not.toContain(id);
  expect(sessionCookie(response).value).toBe(id);
  expect(sessionCookie(response).attributes.has("httponly")).toBe(true);
  expect(
    sessionCookie(response).attributes.get("samesite")?.toLowerCase(),
  ).toBe("lax");
  expect(sessionCookie(response).attributes.get("path")).toBe("/");
  expect(sessionCookie(response).attributes.has("domain")).toBe(false);
  expect(sessionCookie(response).attributes.has("secure")).toBe(false);
  await expect(store.get(`handoff:${token}`)).resolves.toBeNull();
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
  });
});

test("R-02.13 the phone cookie is Secure when the request URL is HTTPS", async () => {
  const headers = {
    host: "preview.example",
    origin: "https://preview.example",
    "x-forwarded-host": "evil.example",
    "x-forwarded-proto": "http",
  };
  const { token } = await issuedToken(
    headers,
    "https://preview.example/api/session",
  );

  const response = await POST(
    redeem(token, headers, `https://preview.example/api/handoff/${token}`),
    params(token),
  );

  expect(response.status).toBe(303);
  expect(sessionCookie(response).attributes.has("secure")).toBe(true);
});

test("AC-11.4 the phone cookie uses the 15 minute window", async () => {
  const { token } = await issuedToken();

  const response = await POST(redeem(token), params(token));

  expect(sessionCookie(response).attributes.get("max-age")).toBe("900");
});

test("AC-11.4 the phone cookie uses the 60 second window", async () => {
  const { token } = await issuedToken(
    {},
    "http://localhost:3000/api/session?ttl=1",
  );

  const response = await POST(redeem(token), params(token));

  expect(sessionCookie(response).attributes.get("max-age")).toBe("60");
});

test("AC-02.5 a redeemed token is 410 the second time and sets no cookie", async () => {
  const { id, token } = await issuedToken();

  await POST(redeem(token), params(token));
  const response = await POST(redeem(token), params(token));

  expect(response.status).toBe(410);
  expect(await response.text()).toBe("");
  expect(response.headers.getSetCookie()).toEqual([]);
  expect(response.headers.get("location") ?? "").not.toContain(id);
});

test("R-02.5 an expired token is 410 and the session remains", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  const { id, token } = await issuedToken();
  const store = createMemoryStore();

  vi.advanceTimersByTime(10 * 60 * 1000);
  const response = await POST(redeem(token), params(token));

  expect(response.status).toBe(410);
  expect(response.headers.getSetCookie()).toEqual([]);
  await expect(store.get(`session:${id}`)).resolves.toMatchObject({
    step: "idle",
  });
});

test("R-02.13 a mismatched Origin does not redeem the token", async () => {
  const { token } = await issuedToken();
  const store = createMemoryStore();

  const response = await POST(
    redeem(token, { origin: "https://evil.example" }),
    params(token),
  );

  expect(response.status).toBe(403);
  expect(response.headers.getSetCookie()).toEqual([]);
  await expect(store.get(`handoff:${token}`)).resolves.toMatchObject({
    sessionId: expect.any(String),
  });
});

test("AC-08.6 redeeming a token logs one line and leaves the session id out", async () => {
  const { id, token } = await issuedToken();
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
    const response = await POST(redeem(token), params(token));
    expect(response.status).toBe(303);
  } finally {
    spy.mockRestore();
  }

  expect(lines).toEqual([
    {
      route: `/api/handoff/${token}`,
      status: 303,
      duration: expect.any(Number),
      step: "documentUpload",
      errorCode: null,
    },
  ]);
  expect(JSON.stringify(lines)).not.toContain(id);
});

async function issuedToken(
  headers: Record<string, string> = {},
  url = "http://localhost:3000/api/session",
) {
  const response = await createSession(
    new Request(url, {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        ...headers,
      },
    }),
  );
  const body = (await response.json()) as { handoffToken: string };
  return { id: sessionCookie(response).value, token: body.handoffToken };
}

function redeem(
  token: string,
  headers: Record<string, string> = {},
  url = `http://localhost:3000/api/handoff/${token}`,
) {
  return new Request(url, {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...headers,
    },
  });
}

function params(token: string) {
  return { params: Promise.resolve({ token }) };
}

function sessionCookie(response: Response) {
  const header = response.headers
    .getSetCookie()
    .find((line) => line.toLowerCase().startsWith("session="));
  if (!header) {
    throw new Error("session cookie was not set");
  }
  const [pair, ...parts] = header.split(";").map((part) => part.trim());
  const attributes = new Map(
    parts.map((part) => {
      const [name, value] = part.split("=");
      return [name.toLowerCase(), value ?? ""] as const;
    }),
  );
  return { value: pair.slice("session=".length), attributes };
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error("session was not stored");
}
