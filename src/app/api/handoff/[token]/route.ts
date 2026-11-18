import { NextResponse } from "next/server";
import { logRequest } from "@/lib/analytics/requestLog";
import { requestOrigin } from "@/lib/http/requestHost";
import { createMemoryStore } from "@/lib/store/memoryStore";

// Dynamic route params are a Promise:
// https://nextjs.org/docs/app/api-reference/file-conventions/route#context-optional

type Context = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: Context) {
  const log = { step: null as string | null, errorCode: null as string | null };
  return logRequest(request, () => redeem(request, context, log), log);
}

async function redeem(
  request: Request,
  context: Context,
  log: { step: string | null },
) {
  const target = requestOrigin(request);
  if (request.headers.get("origin") !== target.origin) {
    return new NextResponse(null, { status: 403 });
  }

  const { token } = await context.params;
  const store = createMemoryStore();
  const sessionId = sessionIdFrom(await store.getDel(`handoff:${token}`));
  if (!sessionId) {
    return new NextResponse(null, { status: 410 });
  }

  const session = await store.get(`session:${sessionId}`);
  if (isSession(session)) {
    log.step = session.step;
  }

  const response = NextResponse.redirect(new URL("/m", request.url), 303);
  response.cookies.set("session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: target.secure,
  });
  return response;
}

function sessionIdFrom(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "sessionId" in value &&
    typeof value.sessionId === "string"
  ) {
    return value.sessionId;
  }
  return null;
}

function isSession(value: unknown): value is { step: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "step" in value &&
    typeof value.step === "string"
  );
}
