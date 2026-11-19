import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { requestOrigin } from "@/lib/http/requestHost";
import { createSessionStore } from "@/lib/store/redisStore";

const sessionTtlSeconds = 15 * 60;
const thumbnailLimit = 150 * 1024;

const checks = [
  { id: "corners", label: "All four corners visible", passed: true },
  { id: "readable", label: "Text is readable", passed: true },
  { id: "notExpired", label: "Document hasn't expired", passed: true },
];

export async function POST(request: Request) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, () => saveDocument(request, log), log);
}

async function saveDocument(request: Request, log: { step: string | null }) {
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
  const side = form.get("side");
  const thumbnail = await readThumbnail(form.get("thumbnail"));
  if ((side !== "front" && side !== "back") || thumbnail === null) {
    return new NextResponse(null, { status: 400 });
  }

  const forced = forcedFailure(existing);
  if (forced === "upload") {
    await store.set(
      `session:${sessionId}`,
      { ...existing, failTries: failTries(existing) + 1 },
      sessionTtlSeconds,
    );
    return new NextResponse(null, { status: 503 });
  }

  const result = forced === "document" ? failedChecks : checks;
  await store.set(
    `session:${sessionId}`,
    {
      ...withoutSpentSwitch(existing, forced),
      side,
      thumbnail,
      checks: result,
    },
    sessionTtlSeconds,
  );

  return NextResponse.json({ passed: forced !== "document", checks: result });
}

const uploadAttempts = 3;

const failedChecks = [
  { id: "blurry", label: "Part of the photo is blurry", passed: false },
  { id: "readable", label: "Text is readable", passed: true },
  { id: "notExpired", label: "Document hasn't expired", passed: true },
];

function forcedFailure(existing: Record<string, unknown>) {
  const fail = existing.fail;
  const tries = failTries(existing);
  if (
    fail === "upload:always" ||
    (fail === "upload" && tries < uploadAttempts)
  ) {
    return "upload" as const;
  }
  if (fail === "document:always" || (fail === "document" && tries < 1)) {
    return "document" as const;
  }
  return null;
}

function failTries(existing: Record<string, unknown>) {
  return typeof existing.failTries === "number" ? existing.failTries : 0;
}

function withoutSpentSwitch(
  existing: Record<string, unknown>,
  forced: "document" | null,
) {
  if (forced === "document" && existing.fail === "document:always") {
    return existing;
  }
  if (existing.fail !== "upload" && existing.fail !== "document") {
    return existing;
  }
  const next = { ...existing };
  delete next.fail;
  delete next.failTries;
  return next;
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

async function readThumbnail(value: FormDataEntryValue | null) {
  const bytes = await thumbnailBytes(value);
  if (
    bytes === null ||
    bytes.length < 3 ||
    bytes.length > thumbnailLimit ||
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
