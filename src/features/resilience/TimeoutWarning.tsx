"use client";

import { useEffect, useRef } from "react";
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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-neutral-950/40 p-4">
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="timeout-title"
        className="flex w-full max-w-xl flex-col gap-4 border-2 border-neutral-950 bg-white p-6 text-neutral-950"
      >
        <h2
          id="timeout-title"
          ref={heading}
          tabIndex={-1}
          className="text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {t("errors.SESSION_TIMEOUT_WARNING.title")}
        </h2>
        <p aria-live="polite" className="text-base leading-6">
          {t("errors.SESSION_TIMEOUT_WARNING.body", {
            time: countdownLabel(remainingMs),
          })}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="bg-neutral-950 px-4 py-3 text-white"
            onClick={onStay}
          >
            {t("errors.SESSION_TIMEOUT_WARNING.stay")}
          </button>
          <button
            type="button"
            className="border border-neutral-950 px-4 py-3"
            onClick={onEnd}
          >
            {t("errors.SESSION_TIMEOUT_WARNING.end")}
          </button>
        </div>
      </div>
    </div>
  );
}
