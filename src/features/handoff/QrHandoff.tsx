"use client";

import { useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";

type Props = {
  token: string;
  host: string;
  onContinueHere: () => void;
  phoneConnected?: boolean;
};

export function QrHandoff({
  token,
  host,
  onContinueHere,
  phoneConnected = false,
}: Props) {
  const { content, t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const url = `https://${host}/m/${token}`;

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen
      width="wide"
      action={
        <Button
          variant="secondary"
          className="w-full md:w-fit"
          onClick={onContinueHere}
        >
          {t("handoff.fallback")}
        </Button>
      }
    >
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("handoff.title")}
      </h1>
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="w-fit rounded-lg border border-line bg-surface p-4">
          <QRCodeSVG
            value={url}
            title={t("handoff.qrAlt")}
            size={192}
            marginSize={4}
            aria-describedby="handoff-url"
          />
        </div>
        <ol className="list-decimal pl-5 leading-6">
          {content.handoff.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      <p id="handoff-url" className="sr-only">
        {url}
      </p>
      {phoneConnected ? (
        <p role="status" aria-live="polite" className="text-base leading-6">
          {t("handoff.connected")}
        </p>
      ) : (
        <p className="text-base leading-6">{t("handoff.waiting")}</p>
      )}
    </Screen>
  );
}
