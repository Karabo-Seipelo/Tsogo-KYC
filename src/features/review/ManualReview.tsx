"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";

export const manualReviewHours = 24;

type Props = {
  reference: string;
};

export function ManualReview({ reference }: Props) {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen
      action={
        <Button className="w-full md:w-fit">{t("manualReview.cta")}</Button>
      }
    >
      <ResultMark tone="info" />
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("manualReview.title")}
      </h1>
      <p className="text-base leading-6">
        {t("manualReview.body", { hours: manualReviewHours })}
      </p>
      <p className="rounded-lg bg-canvas px-4 py-3 text-base leading-6">
        {t("manualReview.reference", { reference })}
      </p>
    </Screen>
  );
}

function ResultMark({ tone }: { tone: "info" | "success" }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-12 place-items-center rounded-full ${tone === "info" ? "bg-info-soft text-info" : "bg-success-soft text-success"}`}
    >
      <svg viewBox="0 0 16 16" className="size-6">
        {tone === "success" ? (
          <path
            d="M3 8.2 6.2 11.5 13 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ) : (
          <>
            <path
              d="M8 4.5 V9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="8" cy="11.5" r="0.8" fill="currentColor" />
          </>
        )}
      </svg>
    </span>
  );
}
