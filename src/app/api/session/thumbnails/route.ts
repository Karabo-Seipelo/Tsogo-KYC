import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { createSessionStore } from "@/lib/store/redisStore";

export async function GET(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, async () => readThumbnails(request, log), log);
}

async function readThumbnails(request: Request, log: { step: string | null }) {
  const sessionId = readSessionId(request);
  if (!sessionId) {
    return new NextResponse(null, { status: 401 });
  }

  const store = createSessionStore();
  const session = await store.get(`session:${sessionId}`);
  if (!isRecord(session) || typeof session.step !== "string") {
    return new NextResponse(null, { status: 401 });
  }

  log.step = session.step;
  return NextResponse.json({
    document: jpegDataUrl(session.thumbnail),
    selfie: jpegDataUrl(session.selfieThumbnail),
  });
}

function jpegDataUrl(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return `data:image/jpeg;base64,${value}`;
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
