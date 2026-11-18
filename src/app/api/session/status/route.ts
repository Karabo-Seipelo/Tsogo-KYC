import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { createMemoryStore } from "@/lib/store/memoryStore";

type SessionRecord = {
  step: string;
  phoneConnected?: boolean;
  lastSeen?: string | null;
  checks?: unknown[];
  handoffToken?: string;
  expiresAt?: string;
  ttl?: number;
  outcome?: string;
  reference?: string;
};

export async function GET(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, async () => readStatus(request, log), log);
}

async function readStatus(request: Request, log: { step: string | null }) {
  const sessionId = readSessionId(request);
  if (!sessionId) {
    return new NextResponse(null, { status: 401 });
  }

  const store = createMemoryStore();
  const session = await store.get(`session:${sessionId}`);
  if (!isSession(session)) {
    return new NextResponse(null, { status: 401 });
  }

  const handoff =
    typeof session.handoffToken === "string"
      ? await store.get(`handoff:${session.handoffToken}`)
      : null;

  log.step = session.step;
  const expiry = sessionExpiry(session);
  return NextResponse.json({
    step: session.step,
    phoneConnected: connectedWithin(session.lastSeen, 30_000),
    lastSeen: session.lastSeen ?? null,
    checks: Array.isArray(session.checks) ? session.checks : [],
    handoffExpired: handoff === null,
    expired: expiry.expired,
    expiresAt: expiry.expiresAt,
    ...(session.ttl === 1 ? { ttl: 1 } : {}),
    ...(session.outcome === "rejected" ? { outcome: "rejected" } : {}),
    ...(typeof session.reference === "string"
      ? { reference: session.reference }
      : {}),
  });
}

function sessionExpiry(session: SessionRecord) {
  if (typeof session.expiresAt !== "string") {
    return { expired: false, expiresAt: null };
  }
  const deadline = Date.parse(session.expiresAt);
  return {
    expired: !Number.isNaN(deadline) && Date.now() >= deadline,
    expiresAt: session.expiresAt,
  };
}

function connectedWithin(
  lastSeen: string | null | undefined,
  windowMs: number,
) {
  if (typeof lastSeen !== "string") {
    return false;
  }
  const seen = Date.parse(lastSeen);
  return !Number.isNaN(seen) && Date.now() - seen <= windowMs;
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

function isSession(value: unknown): value is SessionRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "step" in value &&
    typeof value.step === "string"
  );
}
