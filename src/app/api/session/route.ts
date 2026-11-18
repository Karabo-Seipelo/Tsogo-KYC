import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { createMemoryStore } from "@/lib/store/memoryStore";

const sessionTtlSeconds = 15 * 60;
const handoffTtlSeconds = 10 * 60;

export async function POST(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, () => createSession(request, log), log);
}

async function createSession(request: Request, log: { step: string | null }) {
  const target = publicOrigin(request);
  if (request.headers.get("origin") !== target.origin) {
    return new NextResponse(null, { status: 403 });
  }

  const sessionId = randomUUID();
  const handoffToken = randomBytes(16).toString("hex");
  const store = createMemoryStore();
  await store.set(
    `session:${sessionId}`,
    { step: "idle", handoffToken },
    sessionTtlSeconds,
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

function publicOrigin(request: Request) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.replace(":", "");
  return { origin: `${protocol}://${host}`, secure: protocol === "https" };
}
