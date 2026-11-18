"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";

export function CompleteScreen() {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen
      action={<Button className="w-full md:w-fit">{t("complete.cta")}</Button>}
    >
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("complete.title")}
      </h1>
      <p className="text-base leading-6">{t("complete.body")}</p>
    </Screen>
  );
}
