"use client";

import { useContent } from "@/lib/content/useContent";
import type { ContentKey } from "@/lib/content/t";
import { Progress } from "./Progress";

const steps = ["document", "selfie", "liveness", "review"] as const;

const nameKey: Record<(typeof steps)[number], ContentKey> = {
  document: "common.progress.steps.document",
  selfie: "common.progress.steps.selfie",
  liveness: "common.progress.steps.liveness",
  review: "common.progress.steps.review",
};

type Props = {
  step: (typeof steps)[number];
};

export function JourneyProgress({ step }: Props) {
  const { t } = useContent();

  return (
    <Progress
      current={steps.indexOf(step) + 1}
      total={steps.length}
      name={t(nameKey[step])}
    />
  );
}
