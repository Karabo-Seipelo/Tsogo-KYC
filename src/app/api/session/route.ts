import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { requestOrigin } from "@/lib/http/requestHost";
import { createSessionStore } from "@/lib/store/redisStore";

const sessionTtlSeconds = 15 * 60;
const handoffTtlSeconds = 10 * 60;
const failSwitches = new Set([
  "upload",
  "upload:always",
  "document",
  "document:always",
  "match",
  "match:always",
  "reject",
]);

function sessionSwitches(request: Request) {
  const params = new URL(request.url).searchParams;
  const fail = params.get("fail");
  const ttl = params.get("ttl");
  return {
    ...(fail !== null && failSwitches.has(fail) ? { fail } : {}),
    ...(ttl === "1" ? { ttl: 1 } : {}),
  };
}

export async function POST(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, () => createSession(request, log), log);
}

async function createSession(request: Request, log: { step: string | null }) {
  const target = requestOrigin(request);
  if (request.headers.get("origin") !== target.origin) {
    return new NextResponse(null, { status: 403 });
  }

  const sessionId = randomUUID();
  const handoffToken = randomBytes(16).toString("hex");
  const switches = sessionSwitches(request);
  const windowSeconds = switches.ttl === 1 ? 60 : sessionTtlSeconds;
  const store = createSessionStore();
  await store.set(
    `session:${sessionId}`,
    {
      step: "idle",
      handoffToken,
      expiresAt: new Date(Date.now() + windowSeconds * 1000).toISOString(),
      ...switches,
    },
    windowSeconds + 1,
  );
  await store.set(`handoff:${handoffToken}`, { sessionId }, handoffTtlSeconds);

  const response = NextResponse.json({
    handoffToken,
    handoffExpiresAt: new Date(
      Date.now() + handoffTtlSeconds * 1000,
    ).toISOString(),
  });
  response.cookies.set("session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: target.secure,
  });
  log.step = "idle";
  return response;
}
