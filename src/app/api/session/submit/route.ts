import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { createMemoryStore } from "@/lib/store/memoryStore";

const sessionTtlSeconds = 15 * 60;
const resultDelayMs = 5_000;

export async function POST(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, () => beginProcessing(request, log), log);
}

async function beginProcessing(request: Request, log: { step: string | null }) {
  if (!originAllowed(request)) {
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

  await store.set(
    `session:${sessionId}`,
    { ...existing, step: "processing" },
    sessionTtlSeconds,
  );
  setTimeout(() => {
    void recordResult(sessionId);
  }, resultDelayMs);

  log.step = "processing";
  return NextResponse.json({ step: "processing" }, { status: 202 });
}

async function recordResult(sessionId: string) {
  const store = createMemoryStore();
  const existing = await store.get(`session:${sessionId}`);
  if (!isRecord(existing)) {
    return;
  }
  const rejected = existing.fail === "reject";
  await store.set(
    `session:${sessionId}`,
    {
      ...existing,
      step: rejected ? "error" : "complete",
      ...(rejected
        ? { outcome: "rejected", reference: supportReference() }
        : {}),
    },
    sessionTtlSeconds,
  );
  if (typeof existing.handoffToken === "string") {
    await store.getDel(`handoff:${existing.handoffToken}`);
  }
}

function supportReference() {
  return randomBytes(4).toString("hex").toUpperCase();
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
