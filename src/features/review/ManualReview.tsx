"use client";

import { useEffect, useRef } from "react";
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
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {t("manualReview.title")}
        </h1>
        <p className="text-base leading-6">
          {t("manualReview.body", { hours: manualReviewHours })}
        </p>
        <p className="text-base leading-6">
          {t("manualReview.reference", { reference })}
        </p>
        <button
          type="button"
          className="w-full bg-neutral-950 px-4 py-3 text-white sm:w-fit"
        >
          {t("manualReview.cta")}
        </button>
      </div>
    </main>
  );
}
