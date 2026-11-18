"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { JourneyProgress } from "@/components/ui/JourneyProgress";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
import type { DocumentKind } from "@/features/capture/DocumentType";
import { useContent } from "@/lib/content/useContent";

const confirmReasonId = "review-confirm-required";

export type ReviewCheck = {
  id: string;
  label: string;
  passed: boolean;
};

type Props = {
  documentType: DocumentKind;
  documentSrc: string;
  selfieSrc: string;
  checks: ReviewCheck[];
  livenessPassed: boolean;
  matched: boolean;
  onRetake: (target: "document" | "selfie") => void;
  onSubmit: () => void;
};

export function ReviewScreen({
  documentType,
  documentSrc,
  selfieSrc,
  checks,
  livenessPassed,
  matched,
  onRetake,
  onSubmit,
}: Props) {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen
      width="wide"
      action={
        <Button
          className="w-full"
          disabled={!confirmed}
          aria-describedby={confirmed ? undefined : confirmReasonId}
          onClick={onSubmit}
        >
          {t("review.submit")}
        </Button>
      }
    >
      <JourneyProgress step="review" />
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("review.title")}
      </h1>
      <p className="text-base leading-6">{t("review.intro")}</p>
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{t("review.rows.document")}</h2>
        <p>{t(`document.select.options.${documentType}.title`)}</p>
        <div className="flex gap-4">
          <Photo src={documentSrc} label={t("faceMatch.documentPhoto")} />
          <Photo src={selfieSrc} label={t("faceMatch.selfie")} />
        </div>
        <Retake
          label={t("review.rows.document")}
          onClick={() => onRetake("document")}
        />
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">
          {t("review.rows.documentCheck")}
        </h2>
        <ul className="flex flex-col gap-2">
          {checks.map((check) => (
            <li key={check.id}>
              {check.passed ? <span aria-hidden="true">✓ </span> : null}
              {check.label}
              {check.passed ? ` ${t("common.status.passed")}` : ""}
            </li>
          ))}
        </ul>
      </section>
      <Result
        label={t("review.rows.liveness")}
        passed={livenessPassed}
        passedLabel={t("common.status.passed")}
      />
      <section className="flex flex-col gap-2">
        <Result
          label={t("review.rows.faceMatch")}
          passed={matched}
          passedLabel={t("common.status.passed")}
        />
        <Retake
          label={t("faceMatch.selfie")}
          onClick={() => onRetake("selfie")}
        />
      </section>
      <label className="flex min-h-11 items-start gap-3 text-base leading-6">
        <input
          className="mt-1 size-5 accent-ink"
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        {t("review.confirm")}
      </label>
      {confirmed ? null : (
        <p id={confirmReasonId} className="text-sm text-ink-muted">
          {t("review.confirmRequired")}
        </p>
      )}
    </Screen>
  );
}

function Photo({ src, label }: { src: string; label: string }) {
  return (
    <figure className="flex w-28 flex-col gap-2">
      {/* Session blob URLs are not static assets, so next/image cannot optimize them. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="aspect-square w-full rounded-md border border-line-strong object-cover"
      />
      <figcaption className="text-sm">{label}</figcaption>
    </figure>
  );
}

function Result({
  label,
  passed,
  passedLabel,
}: {
  label: string;
  passed: boolean;
  passedLabel: string;
}) {
  return (
    <p>
      <span className="font-semibold">{label}</span>
      {passed ? (
        <>
          <span aria-hidden="true"> ✓ </span>
          {passedLabel}
        </>
      ) : null}
    </p>
  );
}

function Retake({ label, onClick }: { label: string; onClick: () => void }) {
  const { t } = useContent();

  return (
    <Button variant="text" className="w-fit px-0" onClick={onClick}>
      {t("review.retake")} {label}
    </Button>
  );
}
