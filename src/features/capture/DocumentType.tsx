"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { JourneyProgress } from "@/components/ui/JourneyProgress";
import { OptionCard } from "@/components/ui/OptionCard";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
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
    <Screen
      action={
        <Button
          className="w-full md:w-fit"
          disabled={choice === null}
          onClick={() => {
            if (choice) {
              onContinue({ type: choice, sides: sidesFor[choice] });
            }
          }}
        >
          {t("common.actions.continue")}
        </Button>
      }
    >
      <JourneyProgress step="document" />
      <h1 id="document-type-title" className={screenTitle}>
        {t("document.select.title")}
      </h1>
      <p className="text-base leading-6">{t("document.select.intro")}</p>
      <div
        role="radiogroup"
        aria-labelledby="document-type-title"
        className="flex flex-col gap-3"
      >
        {options.map((type) => (
          <OptionCard
            key={type}
            name="document-type"
            value={type}
            checked={choice === type}
            onChange={() => select(type)}
            title={t(`document.select.options.${type}.title`)}
            description={t(`document.select.options.${type}.description`)}
          />
        ))}
      </div>
    </Screen>
  );
}
