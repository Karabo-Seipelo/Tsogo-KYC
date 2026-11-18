"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/useContent";

export type DocumentKind = "passport" | "nationalId" | "driversLicence";

export type DocumentChoice = {
  type: DocumentKind;
  sides: 1 | 2;
};

const sidesFor: Record<DocumentKind, 1 | 2> = {
  passport: 1,
  nationalId: 2,
  driversLicence: 2,
};

const options: DocumentKind[] = ["passport", "nationalId", "driversLicence"];

type Props = {
  onChoose: (choice: DocumentChoice) => void;
  onContinue: (choice: DocumentChoice) => void;
};

export function DocumentType({ onChoose, onContinue }: Props) {
  const { t } = useContent();
  const [choice, setChoice] = useState<DocumentKind | null>(null);

  function select(type: DocumentKind) {
    setChoice(type);
    onChoose({ type, sides: sidesFor[type] });
  }

  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1
          id="document-type-title"
          className="text-3xl font-semibold tracking-tight"
        >
          {t("document.select.title")}
        </h1>
        <p className="text-base leading-6">{t("document.select.intro")}</p>
        <div
          role="radiogroup"
          aria-labelledby="document-type-title"
          className="flex flex-col gap-3"
        >
          {options.map((type) => (
            <label
              key={type}
              className="flex items-start gap-3 border border-neutral-300 p-4 has-checked:border-neutral-950"
            >
              <input
                className="mt-1"
                type="radio"
                name="document-type"
                value={type}
                checked={choice === type}
                onChange={() => select(type)}
              />
              <span>
                <span className="block font-semibold">
                  {t(`document.select.options.${type}.title`)}
                </span>
                <span className="mt-1 block text-sm leading-6">
                  {t(`document.select.options.${type}.description`)}
                </span>
              </span>
            </label>
          ))}
        </div>
        <button
          type="button"
          className="w-full bg-neutral-950 px-4 py-3 text-white disabled:opacity-40 sm:w-fit"
          disabled={choice === null}
          onClick={() => {
            if (choice) {
              onContinue({ type: choice, sides: sidesFor[choice] });
            }
          }}
        >
          {t("common.actions.continue")}
        </button>
      </div>
    </main>
  );
}
