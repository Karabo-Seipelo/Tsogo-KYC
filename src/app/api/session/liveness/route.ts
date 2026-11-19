import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { createSessionStore } from "@/lib/store/redisStore";

const sessionTtlSeconds = 15 * 60;

export async function POST(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, () => saveLiveness(request, log), log);
}

async function saveLiveness(request: Request, log: { step: string | null }) {
  if (!originAllowed(request)) {
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
  log.step = typeof existing.step === "string" ? existing.step : null;

  await store.set(
    `session:${sessionId}`,
    { ...existing, livenessPassed: true },
    sessionTtlSeconds,
  );

  return NextResponse.json({ passed: true });
}

function originAllowed(request: Request) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.replace(":", "");
  return request.headers.get("origin") === `${protocol}://${host}`;
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
