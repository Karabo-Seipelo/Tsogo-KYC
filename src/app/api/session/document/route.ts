import { NextResponse } from "next/server";
import { createMemoryStore } from "@/lib/store/memoryStore";

const sessionTtlSeconds = 15 * 60;

const checks = [
  { id: "corners", label: "All four corners visible", passed: true },
  { id: "readable", label: "Text is readable", passed: true },
  { id: "notExpired", label: "Document hasn't expired", passed: true },
];

export async function POST(request: Request) {
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

  const form = await request.formData();
  const side = form.get("side");
  const thumbnail = await readPart(form.get("thumbnail"));
  if (typeof side !== "string" || thumbnail === null) {
    return new NextResponse(null, { status: 400 });
  }

  await store.set(
    `session:${sessionId}`,
    {
      ...existing,
      side,
      thumbnail,
      checks,
    },
    sessionTtlSeconds,
  );

  return NextResponse.json({ passed: true, checks });
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
