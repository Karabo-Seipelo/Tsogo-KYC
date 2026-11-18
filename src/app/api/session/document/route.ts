import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { createMemoryStore } from "@/lib/store/memoryStore";

const sessionTtlSeconds = 15 * 60;

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

  const store = createMemoryStore();
  const existing = await store.get(`session:${sessionId}`);
  if (!isRecord(existing)) {
    return new NextResponse(null, { status: 401 });
  }
  log.step = typeof existing.step === "string" ? existing.step : null;

  const form = await request.formData();
  const side = form.get("side");
  const thumbnail = await readPart(form.get("thumbnail"));
  if (typeof side !== "string" || thumbnail === null) {
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

async function readPart(value: FormDataEntryValue | null) {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value.text === "function") {
    return value.text();
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
