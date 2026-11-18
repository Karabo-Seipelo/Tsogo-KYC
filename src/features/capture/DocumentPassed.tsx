"use client";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
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
    <Screen
      action={
        <div className="flex flex-col gap-3 md:flex-row">
          <Button className="w-full md:w-fit" onClick={onContinue}>
            {t("common.actions.continue")}
          </Button>
          <Button
            variant="secondary"
            className="w-full md:w-fit"
            onClick={onRetake}
          >
            {t("common.actions.retakePhoto")}
          </Button>
        </div>
      }
    >
      <h1 className={screenTitle}>{t("document.result.passed.title")}</h1>
      <ul className="flex flex-col gap-2">
        {checks.map((check) => (
          <li key={check.id}>
            <span aria-hidden="true">✓ </span>
            {check.label}
          </li>
        ))}
      </ul>
    </Screen>
  );
}
