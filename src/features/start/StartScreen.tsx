"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { focusRing, screenTitle } from "@/components/ui/styles";
import { Tick } from "@/components/ui/Tick";
import { useContent } from "@/lib/content/useContent";

const estimateMinutes = { min: 3, max: 5 };

type Props = {
  onStart: () => void;
};

export function StartScreen({ onStart }: Props) {
  const { content, t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen
      action={
        <Button className="w-full md:w-fit" onClick={onStart}>
          {t("start.cta")}
        </Button>
      }
    >
      <span aria-hidden="true" className="h-1 w-12 bg-gold" />
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("start.title")}
      </h1>
      <p className="text-base leading-6">{t("start.intro")}</p>
      <p className="w-fit rounded-sm bg-surface px-3 py-1 text-sm font-medium md:bg-canvas">
        {t("start.estimate", estimateMinutes)}
      </p>
      <section className="flex flex-col gap-3">
        <h2 className="text-heading font-semibold">
          {t("start.requirementsTitle")}
        </h2>
        <ul className="flex flex-col gap-3">
          {content.start.requirements.map((item) => (
            <li key={item} className="flex gap-3 text-base leading-6">
              <Tick />
              {item}
            </li>
          ))}
        </ul>
      </section>
      <div className="rounded-lg bg-surface p-4 text-sm leading-6 md:bg-canvas">
        {t("start.privacy")}{" "}
        <a
          href="/privacy"
          className={`text-gold-strong underline ${focusRing}`}
        >
          {t("start.privacyLink")}
        </a>
      </div>
    </Screen>
  );
}
