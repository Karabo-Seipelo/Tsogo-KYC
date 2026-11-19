import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { createSessionStore } from "@/lib/store/redisStore";

const sessionTtlSeconds = 15 * 60;

export async function POST(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, () => saveSelfie(request, log), log);
}

async function saveSelfie(request: Request, log: { step: string | null }) {
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

  const form = await request.formData();
  const selfieThumbnail = await readThumbnail(form.get("thumbnail"));
  if (selfieThumbnail === null) {
    return new NextResponse(null, { status: 400 });
  }

  await store.set(
    `session:${sessionId}`,
    { ...existing, selfieThumbnail },
    sessionTtlSeconds,
  );

  return NextResponse.json({ ok: true });
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

const thumbnailLimit = 150 * 1024;

async function readThumbnail(value: FormDataEntryValue | null) {
  const bytes = await thumbnailBytes(value);
  if (
    bytes === null ||
    bytes.length > thumbnailLimit ||
    bytes.length < 3 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[2] !== 0xff
  ) {
    return null;
  }
  return Buffer.from(bytes).toString("base64");
}

async function thumbnailBytes(value: FormDataEntryValue | null) {
  if (typeof value === "string") {
    return new TextEncoder().encode(value);
  }
  if (value && typeof value.arrayBuffer === "function") {
    return new Uint8Array(await value.arrayBuffer());
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
