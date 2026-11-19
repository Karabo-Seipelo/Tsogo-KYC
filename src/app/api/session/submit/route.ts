import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { requestOrigin } from "@/lib/http/requestHost";
import { createSessionStore } from "@/lib/store/redisStore";

const sessionTtlSeconds = 15 * 60;
const resultDelayMs = 5_000;
const finishedSteps = new Set(["processing", "complete", "error"]);

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

  const store = createSessionStore();
  const existing = await store.get(`session:${sessionId}`);
  if (!isRecord(existing)) {
    return new NextResponse(null, { status: 401 });
  }
  log.step = typeof existing.step === "string" ? existing.step : null;
  if (!readyToSubmit(existing)) {
    return new NextResponse(null, { status: 409 });
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
  const store = createSessionStore();
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

function readyToSubmit(session: Record<string, unknown>) {
  return (
    !finishedSteps.has(String(session.step)) &&
    present(session.thumbnail) &&
    present(session.selfieThumbnail) &&
    passedChecks(session.checks) &&
    session.livenessPassed === true &&
    session.match === true
  );
}

function present(value: unknown) {
  return typeof value === "string" && value.length > 0;
}

function passedChecks(value: unknown) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) => isRecord(item) && "passed" in item && item.passed === true,
    )
  );
}

function supportReference() {
  return randomBytes(4).toString("hex").toUpperCase();
}

function originAllowed(request: Request) {
  return request.headers.get("origin") === requestOrigin(request).origin;
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
