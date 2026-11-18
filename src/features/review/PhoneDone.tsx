"use client";

import { useEffect, useRef } from "react";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";

export function PhoneDone() {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen align="center">
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-full bg-success-soft text-success"
      >
        <svg viewBox="0 0 16 16" className="size-6">
          <path
            d="M3 8.2 6.2 11.5 13 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </span>
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("phoneDone.title")}
      </h1>
      <p className="text-base leading-6">{t("phoneDone.body")}</p>
    </Screen>
  );
}
