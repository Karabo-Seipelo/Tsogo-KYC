"use client";

import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { JourneyProgress } from "@/components/ui/JourneyProgress";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";
import { MAX_ATTEMPTS } from "@/machines/kycMachine";

type Props = {
  phase: "comparing" | "matched" | "noMatch";
  documentSrc: string;
  selfieSrc: string;
  attempt?: number;
  onContinue: () => void;
  onRetake?: () => void;
  onDifferentDocument?: () => void;
};

export function FaceMatch({
  phase,
  documentSrc,
  selfieSrc,
  attempt = 1,
  onContinue,
  onRetake,
  onDifferentDocument,
}: Props) {
  const { content, t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, [phase]);

  return (
    <Screen
      action={
        phase === "matched" ? (
          <Button className="w-full" onClick={onContinue}>
            {t("common.actions.continue")}
          </Button>
        ) : phase === "noMatch" ? (
          <div className="flex flex-col gap-3">
            <Button className="w-full" onClick={onRetake}>
              {t("faceMatch.noMatch.retake")}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={onDifferentDocument}
            >
              {t("faceMatch.noMatch.differentDocument")}
            </Button>
          </div>
        ) : null
      }
    >
      <JourneyProgress step="liveness" />
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {phase === "matched"
          ? t("faceMatch.matched.title")
          : phase === "noMatch"
            ? t("faceMatch.noMatch.title")
            : t("faceMatch.title")}
      </h1>
      {phase === "comparing" ? (
        <>
          <p role="status">{t("faceMatch.comparing")}</p>
          <div className="flex gap-4">
            <Thumbnail src={documentSrc} label={t("faceMatch.documentPhoto")} />
            <Thumbnail src={selfieSrc} label={t("faceMatch.selfie")} />
          </div>
        </>
      ) : null}
      {phase === "matched" ? (
        <Alert tone="success" title={t("faceMatch.matched.body")} />
      ) : null}
      {phase === "noMatch" ? (
        <>
          <div className="flex gap-4">
            <Thumbnail src={documentSrc} label={t("faceMatch.documentPhoto")} />
            <Thumbnail src={selfieSrc} label={t("faceMatch.selfie")} />
          </div>
          <Alert tone="danger" title={content.faceMatch.noMatch.intro}>
            <ul className="flex flex-col gap-1">
              {content.faceMatch.noMatch.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </Alert>
          <p className="text-sm font-medium">
            {t("common.attempt", { attempt, max: MAX_ATTEMPTS })}
          </p>
        </>
      ) : null}
    </Screen>
  );
}

function Thumbnail({ src, label }: { src: string; label: string }) {
  return (
    <figure className="flex w-28 flex-col gap-2">
      {/* Session blob URLs are not static assets, so next/image cannot optimize them. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="aspect-square w-full rounded-md border border-line-strong object-cover"
      />
      <figcaption className="text-sm">{label}</figcaption>
    </figure>
  );
}
