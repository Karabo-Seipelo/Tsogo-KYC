"use client";

import { useEffect, useRef } from "react";
import { useContent } from "@/lib/content/useContent";

const estimateMinutes = { min: 3, max: 5 };

export function StartScreen() {
  const { content, t } = useContent();
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
          {t("start.title")}
        </h1>
        <p className="text-base leading-6">{t("start.intro")}</p>
        <p className="text-sm font-medium">
          {t("start.estimate", estimateMinutes)}
        </p>
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">
            {t("start.requirementsTitle")}
          </h2>
          <ul className="list-disc pl-5 leading-6">
            {content.start.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <p className="text-sm leading-6">
          {t("start.privacy")}{" "}
          <a href="/privacy" className="underline">
            {t("start.privacyLink")}
          </a>
        </p>
        <button
          type="button"
          className="w-full bg-neutral-950 px-4 py-3 text-white sm:w-fit"
        >
          {t("start.cta")}
        </button>
      </div>
    </main>
  );
}
