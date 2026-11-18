"use client";

import { useEffect, useRef, useState } from "react";
import { useContent } from "@/lib/content/useContent";

export const livenessPromptMs = 12_000;

const promptIds = ["turnLeft", "turnRight", "blink"] as const;

type PromptId = (typeof promptIds)[number];

type Props = {
  onPassed: () => void;
};

export function LivenessCheck({ onPassed }: Props) {
  const { content, t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const onPassedRef = useRef(onPassed);
  const [order] = useState(() => shuffle(promptIds));
  const [index, setIndex] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const prompt = order[index] ?? "blink";

  useEffect(() => {
    onPassedRef.current = onPassed;
  }, [onPassed]);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (index + 1 < order.length) {
        setIndex(index + 1);
        return;
      }
      onPassedRef.current();
    }, livenessPromptMs);
    return () => {
      clearTimeout(timer);
    };
  }, [index, order.length]);

  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {t("liveness.title")}
        </h1>
        <p className="text-sm font-medium">
          {t("liveness.progress", { current: index + 1, total: order.length })}
        </p>
        <p aria-live="polite" className="text-base leading-6">
          {t(`liveness.prompts.${prompt}`)}
        </p>
        <button
          type="button"
          className="w-fit text-sm underline"
          onClick={() => setHelpOpen(true)}
        >
          {t("liveness.help")}
        </button>
        {helpOpen ? (
          <dialog
            open
            aria-labelledby="liveness-help-title"
            className="w-full max-w-xl border border-neutral-950 bg-white p-6 text-neutral-950"
          >
            <h2 id="liveness-help-title" className="text-xl font-semibold">
              {t("help.title")}
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {content.help.faq.map((item) => (
                <section key={item.q} className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold">{item.q}</h3>
                  <p className="text-base leading-6">{item.a}</p>
                </section>
              ))}
            </div>
            <p className="mt-4 text-base leading-6">{t("help.support")}</p>
            <button
              type="button"
              className="mt-6 border border-neutral-950 px-4 py-3"
              onClick={() => setHelpOpen(false)}
            >
              {t("help.close")}
            </button>
          </dialog>
        ) : null}
      </div>
    </main>
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
