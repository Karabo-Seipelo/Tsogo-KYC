"use client";

import { useEffect, useRef, useState } from "react";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
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
    <Screen>
      <span className="grid size-12 place-items-center" aria-hidden="true">
        <span className="col-start-1 row-start-1 size-10 rounded-full border-2 border-line border-t-ink motion-safe:animate-spin motion-reduce:hidden" />
        <span className="col-start-1 row-start-1 hidden size-3 rounded-full bg-ink motion-reduce:block" />
      </span>
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("processing.title")}
      </h1>
      <p role="status" className="text-base leading-6">
        {slow ? t("processing.slow") : t("processing.body")}
      </p>
    </Screen>
  );
}
