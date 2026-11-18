import { NextResponse } from "next/server";
import { createMemoryStore } from "@/lib/store/memoryStore";

type SessionRecord = {
  step: string;
  phoneConnected?: boolean;
  lastSeen?: string | null;
  checks?: unknown[];
  handoffToken?: string;
};

export async function GET(request: Request) {
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

  return NextResponse.json({
    step: session.step,
    phoneConnected: session.phoneConnected === true,
    lastSeen: session.lastSeen ?? null,
    checks: Array.isArray(session.checks) ? session.checks : [],
    handoffExpired: handoff === null,
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

function isSession(value: unknown): value is SessionRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "step" in value &&
    typeof value.step === "string"
  );
}
