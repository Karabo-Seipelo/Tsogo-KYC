import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { requestOrigin } from "@/lib/http/requestHost";
import { createSessionStore } from "@/lib/store/redisStore";

const sessionTtlSeconds = 15 * 60;
const handoffTtlSeconds = 10 * 60;

export async function POST(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, () => refreshHandoff(request, log), log);
}

async function refreshHandoff(request: Request, log: { step: string | null }) {
  const target = requestOrigin(request);
  if (request.headers.get("origin") !== target.origin) {
    return new NextResponse(null, { status: 403 });
  }

  const sessionId = readSessionId(request);
  if (!sessionId) {
    return new NextResponse(null, { status: 401 });
  }

  const store = createSessionStore();
  const existing = await store.get(`session:${sessionId}`);
  if (!isRecord(existing)) {
    return new NextResponse(null, { status: 401 });
  }

  if (typeof existing.handoffToken === "string") {
    await store.getDel(`handoff:${existing.handoffToken}`);
  }

  const handoffToken = randomBytes(16).toString("hex");
  await store.set(`handoff:${handoffToken}`, { sessionId }, handoffTtlSeconds);
  await store.set(
    `session:${sessionId}`,
    { ...existing, handoffToken },
    sessionTtlSeconds,
  );
  if (typeof existing.step === "string") {
    log.step = existing.step;
  }

  return NextResponse.json({
    handoffToken,
    handoffExpiresAt: new Date(
      Date.now() + handoffTtlSeconds * 1000,
    ).toISOString(),
  });
}

function readSessionId(request: Request) {
  const header = request.headers.get("cookie");
  if (!header) {
    return null;
  }
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "session" && rest.length > 0) {
      return rest.join("=");
    }
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
