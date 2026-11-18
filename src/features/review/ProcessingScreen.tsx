"use client";

import { useEffect, useRef, useState } from "react";
import { useContent } from "@/lib/content/useContent";

export const statusPollMs = 2_000;
export const slowAfterMs = 120_000;

type Props = {
  onComplete: () => void;
};

export function ProcessingScreen({ onComplete }: Props) {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const onCompleteRef = useRef(onComplete);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), slowAfterMs);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch("/api/session/status");
        if (!response.ok || cancelled) {
          return;
        }
        const body = (await response.json()) as { step?: string };
        if (body.step === "complete") {
          onCompleteRef.current();
        }
      } catch {
        return;
      }
    }

    void poll();
    const timer = setInterval(() => {
      void poll();
    }, statusPollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {t("processing.title")}
        </h1>
        <p role="status" className="text-base leading-6">
          {slow ? t("processing.slow") : t("processing.body")}
        </p>
      </div>
    </main>
  );
}
