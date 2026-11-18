"use client";

import { useContent } from "@/lib/content/useContent";

type Check = {
  id: string;
  label: string;
  passed: boolean;
};

type Props = {
  checks: Check[];
  onContinue: () => void;
  onRetake: () => void;
};

export function DocumentPassed({ checks, onContinue, onRetake }: Props) {
  const { t } = useContent();

  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("document.result.passed.title")}
        </h1>
        <ul className="flex flex-col gap-2">
          {checks.map((check) => (
            <li key={check.id}>
              <span aria-hidden="true">✓ </span>
              {check.label}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="bg-neutral-950 px-4 py-3 text-white"
            onClick={onContinue}
          >
            {t("common.actions.continue")}
          </button>
          <button
            type="button"
            className="border border-neutral-950 px-4 py-3"
            onClick={onRetake}
          >
            {t("common.actions.retakePhoto")}
          </button>
        </div>
      </div>
    </main>
  );
}
