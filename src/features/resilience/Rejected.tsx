"use client";

import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
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
    <Screen
      action={
        <div className="flex flex-col gap-3 md:flex-row">
          <Button className="w-full md:w-fit" onClick={onRetry}>
            {t("errors.VERIFICATION_REJECTED.tryAgain")}
          </Button>
          <Button variant="secondary" className="w-full md:w-fit">
            {t("errors.VERIFICATION_REJECTED.contactSupport")}
          </Button>
        </div>
      }
    >
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {copy.title}
      </h1>
      <Alert tone="danger" title={copy.body} />
      <section className="flex flex-col gap-2">
        <h2 className="text-heading font-semibold">{copy.nextStepsTitle}</h2>
        <ul className="flex flex-col gap-2 leading-6">
          {copy.nextSteps.map((step) => (
            <li key={step}>{step.replaceAll("{reference}", reference)}</li>
          ))}
        </ul>
      </section>
    </Screen>
  );
}
