"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Screen } from "@/components/ui/Screen";
import { focusRing, screenTitle } from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";

type Props = {
  token: string;
  host: string;
  onContinueHere: () => void;
  phoneConnected?: boolean;
  expiresAt?: string;
};

export function QrHandoff({
  token,
  host,
  onContinueHere,
  phoneConnected = false,
  expiresAt,
}: Props) {
  const { content, t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const url = `https://${host}/m/${token}`;
  const remaining = useCountdown(expiresAt);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen width="wide">
      <span aria-hidden="true" className="h-1 w-12 bg-gold" />
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("handoff.title")}
      </h1>
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex w-fit flex-col items-center gap-3 rounded-lg border border-line bg-surface p-4">
          <QRCodeSVG
            value={url}
            title={t("handoff.qrAlt")}
            size={192}
            marginSize={4}
            aria-describedby="handoff-url"
          />
          {remaining ? (
            <p className="text-sm text-ink-muted">
              {t("handoff.expiresIn", { time: remaining })}
            </p>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <ol className="flex list-none flex-col gap-3 [counter-reset:handoff]">
            {content.handoff.steps.map((step) => (
              <li
                key={step}
                className="flex items-center gap-3 [counter-increment:handoff] before:grid before:size-6 before:shrink-0 before:place-items-center before:rounded-full before:bg-ink before:text-xs before:font-semibold before:text-on-ink before:content-[counter(handoff)]"
              >
                {step}
              </li>
            ))}
          </ol>
          {phoneConnected ? (
            <p role="status" aria-live="polite" className="text-base leading-6">
              {t("handoff.connected")}
            </p>
          ) : (
            <p className="rounded-md bg-info-soft px-4 py-3 text-base leading-6 text-ink">
              {t("handoff.waiting")}
            </p>
          )}
          <button
            type="button"
            className={`w-fit cursor-pointer text-left text-sm text-gold-strong underline ${focusRing}`}
            onClick={onContinueHere}
          >
            {t("handoff.fallback")}
          </button>
        </div>
      </div>
      <p id="handoff-url" className="sr-only">
        {url}
      </p>
    </Screen>
  );
}

function useCountdown(expiresAt?: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) {
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) {
    return null;
  }
  const ms = Date.parse(expiresAt) - now;
  if (Number.isNaN(ms)) {
    return null;
  }
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}
