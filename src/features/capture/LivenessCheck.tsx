"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { JourneyProgress } from "@/components/ui/JourneyProgress";
import { Screen } from "@/components/ui/Screen";
import { classes, screenTitle } from "@/components/ui/styles";
import { useOpenHelp } from "@/features/help/HelpDialog";
import { useContent } from "@/lib/content/useContent";

export const livenessConfirmMs = 3_500;
export const livenessPromptMs = 4_000;

const promptIds = ["turnLeft", "turnRight", "blink"] as const;

type PromptId = (typeof promptIds)[number];

type Props = {
  onPassed: () => void;
  stream?: MediaStream | null;
};

export function LivenessCheck({ onPassed, stream }: Props) {
  const { t } = useContent();
  const openHelp = useOpenHelp();
  const heading = useRef<HTMLHeadingElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const onPassedRef = useRef(onPassed);
  const [order] = useState(() => shuffle(promptIds));
  const [index, setIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const prompt = order[index] ?? "blink";

  useEffect(() => {
    onPassedRef.current = onPassed;
  }, [onPassed]);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    if (video.current && stream) {
      video.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    const confirm = setTimeout(() => {
      setConfirmed(true);
    }, livenessConfirmMs);
    const advance = setTimeout(() => {
      if (index + 1 < order.length) {
        setConfirmed(false);
        setIndex(index + 1);
        return;
      }
      onPassedRef.current();
    }, livenessPromptMs);
    return () => {
      clearTimeout(confirm);
      clearTimeout(advance);
    };
  }, [index, order.length]);

  return (
    <Screen>
      <JourneyProgress step="liveness" />
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("liveness.title")}
      </h1>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg bg-ink">
        {stream ? (
          <video
            ref={video}
            className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
            autoPlay
            muted
            playsInline
            aria-label={t("selfie.cameraAlt")}
          />
        ) : null}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[16%] right-[18%] bottom-[16%] left-[18%] rounded-full border-4 border-gold-bright"
        />
      </div>
      <p className="text-sm font-medium">
        {t("liveness.progress", { current: index + 1, total: order.length })}
      </p>
      <div className="flex gap-2" aria-hidden="true">
        {order.map((id, dot) => (
          <span
            key={id}
            className={classes(
              "size-2 rounded-full",
              dot === index ? "bg-gold-strong" : "bg-line",
            )}
          />
        ))}
      </div>
      <p aria-live="polite" className="text-title font-semibold">
        {confirmed ? t("liveness.confirmed") : t(`liveness.prompts.${prompt}`)}
      </p>
      <Button
        variant="secondary"
        className="w-full"
        onClick={(event) => openHelp(event.currentTarget)}
      >
        {t("liveness.help")}
      </Button>
    </Screen>
  );
}

function shuffle(items: readonly PromptId[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swap] ?? current;
    next[swap] = current;
  }
  return next;
}
