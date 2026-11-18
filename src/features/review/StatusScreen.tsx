"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";
import { progressFor } from "@/machines/progress";
import { kycStates, type KycState } from "@/machines/kycMachine.types";
import { ManualReview } from "./ManualReview";

const rowIds = [
  "phoneConnected",
  "documentCaptured",
  "documentChecked",
  "selfie",
  "liveness",
  "faceMatch",
] as const;

type RowId = (typeof rowIds)[number];
type RowState = "done" | "inProgress" | "waiting";

const icons: Record<RowState, string> = {
  done: "✓",
  inProgress: "●",
  waiting: "○",
};

const rank: Record<string, number> = {
  documentUpload: 1,
  documentValidation: 2,
  selfieCapture: 3,
  livenessCheck: 4,
  faceMatch: 5,
  review: 6,
  processing: 6,
  complete: 6,
};

type Props = {
  step: string;
  phoneConnected: boolean;
  onShowQr: () => void;
  onReview: () => void;
  outcome?: string | null;
  reference?: string | null;
};

export function StatusScreen({
  step,
  phoneConnected,
  onShowQr,
  onReview,
  outcome = null,
  reference = null,
}: Props) {
  const { content, t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const rows = rowsFor(step, phoneConnected);
  const current = rows.find((row) => row.state === "inProgress");
  const progress = isKycState(step) ? progressFor(step) : null;

  useEffect(() => {
    heading.current?.focus();
  }, [phoneConnected]);

  useEffect(() => {
    if (step === "review") {
      onReview();
    }
  }, [step, onReview]);

  if (outcome === "manualReview" && reference) {
    return <ManualReview reference={reference} />;
  }

  if (!phoneConnected) {
    return (
      <Screen
        action={
          <Button className="w-full" onClick={onShowQr}>
            {t("status.disconnected.cta")}
          </Button>
        }
      >
        <h1 ref={heading} tabIndex={-1} className={screenTitle}>
          {t("status.disconnected.label")}
        </h1>
        <p className="text-base leading-6">{t("status.disconnected.body")}</p>
        <p role="status" aria-live="polite" className="text-base leading-6">
          {t("status.disconnected.reconnecting")}
        </p>
      </Screen>
    );
  }

  return (
    <Screen>
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("status.title")}
      </h1>
      <p className="text-base leading-6">{t("status.intro")}</p>
      {progress ? (
        <Progress
          current={progress.current}
          total={progress.total}
          name={t(stepNameKey(progress.step))}
        />
      ) : null}
      <p role="status" aria-live="polite" className="sr-only">
        {current
          ? `${labelFor(content, current.id)} ${t("common.status.inProgress")}`
          : t("status.intro")}
      </p>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-3">
              <span aria-hidden="true">{icons[row.state]}</span>
              <span
                className={
                  row.state === "waiting" ? "text-ink-muted" : undefined
                }
              >
                {labelFor(content, row.id)}
              </span>
            </span>
            <span className={statusTone(row.state)}>
              {statusLabel(t, row.state)}
            </span>
          </li>
        ))}
      </ul>
      <Button variant="text" className="w-fit px-0" onClick={onShowQr}>
        {t("status.lostConnection")}
      </Button>
    </Screen>
  );
}

function rowsFor(step: string, phoneConnected: boolean) {
  const reached = rank[step] ?? 0;
  return rowIds.map((id, index) => ({
    id,
    state: rowState(index, reached, phoneConnected),
  }));
}

function rowState(
  index: number,
  reached: number,
  phoneConnected: boolean,
): RowState {
  if (index === 0) {
    return phoneConnected ? "done" : "waiting";
  }
  if (reached > index) {
    return "done";
  }
  if (reached === index) {
    return "inProgress";
  }
  return "waiting";
}

function labelFor(
  content: ReturnType<typeof useContent>["content"],
  id: RowId,
) {
  return content.status.steps[id];
}

function statusTone(state: RowState) {
  if (state === "done") {
    return "text-success";
  }
  if (state === "inProgress") {
    return "font-semibold text-info";
  }
  return "text-ink-muted";
}

function statusLabel(t: ReturnType<typeof useContent>["t"], state: RowState) {
  if (state === "done") {
    return t("common.status.done");
  }
  if (state === "inProgress") {
    return t("common.status.inProgress");
  }
  return t("common.status.waiting");
}

function stepNameKey(step: "document" | "selfie" | "liveness" | "review") {
  if (step === "document") {
    return "common.progress.steps.document" as const;
  }
  if (step === "selfie") {
    return "common.progress.steps.selfie" as const;
  }
  if (step === "liveness") {
    return "common.progress.steps.liveness" as const;
  }
  return "common.progress.steps.review" as const;
}

function isKycState(step: string): step is KycState {
  return kycStates.some((state) => state === step);
}
