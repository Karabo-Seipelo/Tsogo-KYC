"use client";

import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
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
    <Screen
      action={
        <Button className="w-full md:w-fit" onClick={onRestart}>
          {t("errors.SESSION_EXPIRED.cta")}
        </Button>
      }
    >
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("errors.SESSION_EXPIRED.title")}
      </h1>
      <Alert
        tone="danger"
        title={t("errors.SESSION_EXPIRED.body", {
          minutes,
          ...restartEstimate,
        })}
      />
    </Screen>
  );
}
