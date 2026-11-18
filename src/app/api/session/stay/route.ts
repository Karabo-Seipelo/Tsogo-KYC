import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { requestOrigin } from "@/lib/http/requestHost";
import { createMemoryStore } from "@/lib/store/memoryStore";

const sessionWindowSeconds = 15 * 60;
const readableAfterSeconds = 1;
const expiredReadableSeconds = 30;

export async function POST(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, () => stayOrEnd(request, log), log);
}

async function stayOrEnd(request: Request, log: { step: string | null }) {
  const target = requestOrigin(request);
  if (request.headers.get("origin") !== target.origin) {
    return new NextResponse(null, { status: 403 });
  }

  const sessionId = readSessionId(request);
  if (!sessionId) {
    return new NextResponse(null, { status: 401 });
  }

  const store = createMemoryStore();
  const existing = await store.get(`session:${sessionId}`);
  if (!isRecord(existing)) {
    return new NextResponse(null, { status: 401 });
  }

  const ending = await wantsEnd(request);
  const seconds = existing.ttl === 1 ? 60 : sessionWindowSeconds;
  const expiresAt = new Date(
    Date.now() + (ending ? 0 : seconds * 1000),
  ).toISOString();
  await store.set(
    `session:${sessionId}`,
    ending ? withoutCaptures(existing, expiresAt) : { ...existing, expiresAt },
    ending ? expiredReadableSeconds : seconds + readableAfterSeconds,
  );
  if (ending && typeof existing.handoffToken === "string") {
    await store.getDel(`handoff:${existing.handoffToken}`);
  }

  log.step = typeof existing.step === "string" ? existing.step : null;
  return NextResponse.json({ expiresAt });
}

function withoutCaptures(existing: Record<string, unknown>, expiresAt: string) {
  const next: Record<string, unknown> = { ...existing, expiresAt };
  delete next.thumbnail;
  delete next.selfieThumbnail;
  return next;
}

async function wantsEnd(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return false;
  }
  try {
    const body: unknown = await request.json();
    return isRecord(body) && body.end === true;
  } catch {
    return false;
  }
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
