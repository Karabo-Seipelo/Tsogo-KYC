"use client";

import { useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useContent } from "@/lib/content/useContent";

type Props = {
  token: string;
  host: string;
  onContinueHere: () => void;
};

export function QrHandoff({ token, host, onContinueHere }: Props) {
  const { content, t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const url = `https://${host}/m/${token}`;

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {t("handoff.title")}
        </h1>
        <ol className="list-decimal pl-5 leading-6">
          {content.handoff.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <QRCodeSVG
          value={url}
          title={t("handoff.qrAlt")}
          size={192}
          marginSize={4}
          aria-describedby="handoff-url"
        />
        <p id="handoff-url" className="sr-only">
          {url}
        </p>
        <p className="text-base leading-6">{t("handoff.waiting")}</p>
        <button
          type="button"
          className="w-full border border-neutral-950 px-4 py-3 sm:w-fit"
          onClick={onContinueHere}
        >
          {t("handoff.fallback")}
        </button>
      </div>
    </main>
  );
}
