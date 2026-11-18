"use client";

import { useEffect, useRef } from "react";
import { useContent } from "@/lib/content/useContent";

const restartEstimate = { min: 3, max: 5 };

type Props = {
  minutes: number;
  onRestart: () => void;
};

export function SessionExpired({ minutes, onRestart }: Props) {
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
          {t("errors.SESSION_EXPIRED.title")}
        </h1>
        <p className="text-base leading-6">
          {t("errors.SESSION_EXPIRED.body", { minutes, ...restartEstimate })}
        </p>
        <button
          type="button"
          className="w-full bg-neutral-950 px-4 py-3 text-white sm:w-fit"
          onClick={onRestart}
        >
          {t("errors.SESSION_EXPIRED.cta")}
        </button>
      </div>
    </main>
  );
}
