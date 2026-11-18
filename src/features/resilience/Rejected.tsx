"use client";

import { useEffect, useRef } from "react";
import { useContent } from "@/lib/content/useContent";

type Props = {
  reference: string;
  onRetry: () => void;
};

export function Rejected({ reference, onRetry }: Props) {
  const { content, t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const copy = content.errors.VERIFICATION_REJECTED;

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
          {copy.title}
        </h1>
        <p className="text-base leading-6">{copy.body}</p>
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{copy.nextStepsTitle}</h2>
          <ul className="list-disc pl-5 leading-6">
            {copy.nextSteps.map((step) => (
              <li key={step}>{step.replaceAll("{reference}", reference)}</li>
            ))}
          </ul>
        </section>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="bg-neutral-950 px-4 py-3 text-white"
            onClick={onRetry}
          >
            {t("errors.VERIFICATION_REJECTED.tryAgain")}
          </button>
          <button type="button" className="border border-neutral-950 px-4 py-3">
            {t("errors.VERIFICATION_REJECTED.contactSupport")}
          </button>
        </div>
      </div>
    </main>
  );
}
