import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { requestOrigin } from "@/lib/http/requestHost";
import { createMemoryStore } from "@/lib/store/memoryStore";

const sessionTtlSeconds = 15 * 60;

export async function POST(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, () => markManualReview(request, log), log);
}

async function markManualReview(
  request: Request,
  log: { step: string | null },
) {
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

  const reference =
    typeof existing.reference === "string"
      ? existing.reference
      : randomBytes(4).toString("hex").toUpperCase();
  await store.set(
    `session:${sessionId}`,
    { ...existing, outcome: "manualReview", reference },
    sessionTtlSeconds,
  );

  log.step = typeof existing.step === "string" ? existing.step : null;
  return NextResponse.json({ reference });
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
