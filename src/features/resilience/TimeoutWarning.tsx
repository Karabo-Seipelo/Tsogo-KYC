"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { focusRing, panelMotion } from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";

const announceEverySeconds = 30;
const longWarningMs = 2 * 60 * 1000;
const shortWarningMs = 30 * 1000;

export function warningLeadMs(ttl: 1 | null) {
  return ttl === 1 ? shortWarningMs : longWarningMs;
}

export function shouldWarn(remainingMs: number, ttl: 1 | null) {
  return remainingMs > 0 && remainingMs <= warningLeadMs(ttl);
}

export function countdownLabel(remainingMs: number) {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const announced =
    seconds === 0
      ? 0
      : Math.ceil(seconds / announceEverySeconds) * announceEverySeconds;
  const minutes = Math.floor(announced / 60);
  const rest = announced % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

type Props = {
  remainingMs: number;
  onStay: () => void;
  onEnd: () => void;
};

export function TimeoutWarning({ remainingMs, onStay, onEnd }: Props) {
  const { t } = useContent();
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const onStayRef = useRef(onStay);

  useEffect(() => {
    onStayRef.current = onStay;
  }, [onStay]);

  useEffect(() => {
    heading.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onStayRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel.current) {
        return;
      }
      const items = [
        ...panel.current.querySelectorAll<HTMLElement>(
          "button:not([disabled])",
        ),
      ];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === heading.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/48 p-4 sm:items-center">
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="timeout-title"
        className={`flex w-full max-w-xl flex-col gap-4 rounded-lg bg-surface p-6 text-ink shadow-dialog ${panelMotion}`}
      >
        <h2
          id="timeout-title"
          ref={heading}
          tabIndex={-1}
          className={`text-heading font-semibold ${focusRing}`}
        >
          {t("errors.SESSION_TIMEOUT_WARNING.title")}
        </h2>
        <p aria-live="polite" className="text-base leading-6">
          {t("errors.SESSION_TIMEOUT_WARNING.body", {
            time: countdownLabel(remainingMs),
          })}
        </p>
        <div className="flex flex-row-reverse flex-wrap justify-start gap-3">
          <Button onClick={onStay}>
            {t("errors.SESSION_TIMEOUT_WARNING.stay")}
          </Button>
          <Button variant="secondary" onClick={onEnd}>
            {t("errors.SESSION_TIMEOUT_WARNING.end")}
          </Button>
        </div>
      </div>
    </div>
  );
}
