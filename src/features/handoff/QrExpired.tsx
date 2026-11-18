"use client";

import { useEffect, useRef, useState } from "react";
import { useContent } from "@/lib/content/useContent";
import { QrHandoff } from "./QrHandoff";
import { useStatusPoll } from "./useStatusPoll";

export const handoffWindowMinutes = 10;

export type HandoffCode = {
  token: string;
  expiresAt: string;
};

type ScreenProps = {
  token: string;
  expiresAt: string;
  host: string;
  onContinueHere: () => void;
  onIssued: (code: HandoffCode) => void;
};

export function HandoffScreen({
  token,
  expiresAt,
  host,
  onContinueHere,
  onIssued,
}: ScreenProps) {
  const [override, setOverride] = useState<HandoffCode | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const status = useStatusPoll();
  const code = override ?? { token, expiresAt };
  const remaining = Date.parse(code.expiresAt) - now;
  const expired = Number.isNaN(remaining) || remaining <= 0;

  useEffect(() => {
    const wait = Date.parse(code.expiresAt) - Date.now();
    if (Number.isNaN(wait) || wait <= 0) {
      return;
    }
    const id = window.setTimeout(() => setNow(Date.now()), wait);
    return () => window.clearTimeout(id);
  }, [code.expiresAt]);

  if (expired) {
    return (
      <QrExpired
        onContinueHere={onContinueHere}
        onIssued={(issued) => {
          setOverride(issued);
          onIssued(issued);
        }}
      />
    );
  }

  return (
    <QrHandoff
      token={code.token}
      host={host}
      onContinueHere={onContinueHere}
      phoneConnected={status?.phoneConnected === true}
    />
  );
}

type ExpiredProps = {
  onContinueHere: () => void;
  onIssued: (code: HandoffCode) => void;
};

export function QrExpired({ onContinueHere, onIssued }: ExpiredProps) {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  async function refresh() {
    setPending(true);
    try {
      const response = await fetch("/api/session/handoff", { method: "POST" });
      if (!response.ok) {
        return;
      }
      const issued = handoffCodeFrom(await response.json());
      if (issued) {
        onIssued(issued);
      }
    } catch {
      return;
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {t("handoff.expired.title")}
        </h1>
        <p className="text-base leading-6">
          {t("handoff.expired.body", { minutes: handoffWindowMinutes })}
        </p>
        <button
          type="button"
          className="w-full bg-neutral-950 px-4 py-3 text-white sm:w-fit"
          disabled={pending}
          onClick={() => {
            void refresh();
          }}
        >
          {t("handoff.expired.cta")}
        </button>
        <button
          type="button"
          className="w-full border border-neutral-950 px-4 py-3 sm:w-fit"
          onClick={onContinueHere}
        >
          {t("handoff.expired.fallback")}
        </button>
      </div>
    </main>
  );
}

export function handoffCodeFrom(body: unknown): HandoffCode | null {
  if (!isRecord(body)) {
    return null;
  }
  const token = body.handoffToken;
  const expiresAt = body.handoffExpiresAt;
  if (typeof token !== "string" || typeof expiresAt !== "string") {
    return null;
  }
  return { token, expiresAt };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
