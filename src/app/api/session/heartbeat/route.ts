import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { requestOrigin } from "@/lib/http/requestHost";
import { createMemoryStore } from "@/lib/store/memoryStore";

const sessionTtlSeconds = 15 * 60;

export async function POST(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, () => recordHeartbeat(request, log), log);
}

async function recordHeartbeat(request: Request, log: { step: string | null }) {
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

  const reported = await reportedStep(request);
  await store.set(
    `session:${sessionId}`,
    {
      ...existing,
      lastSeen: new Date().toISOString(),
      ...(reported ? { step: reported } : {}),
    },
    sessionTtlSeconds,
  );
  log.step =
    reported ?? (typeof existing.step === "string" ? existing.step : null);
  return new NextResponse(null, { status: 204 });
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

async function reportedStep(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return null;
  }
  try {
    const body: unknown = await request.json();
    if (isRecord(body) && typeof body.step === "string") {
      return body.step;
    }
  } catch {
    return null;
  }
  return null;
}
