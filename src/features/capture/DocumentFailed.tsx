"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";
import { MAX_ATTEMPTS } from "@/machines/kycMachine";

const reasons = ["blurry", "glare", "cropped", "expired"] as const;

export type DocumentReason = (typeof reasons)[number];

type FailedProps = {
  reason: DocumentReason;
  attempt: number;
  onRetake: () => void;
};

type CameraProps = {
  error: "NotAllowedError" | "NotFoundError" | "NotReadableError";
  onRetry: () => void;
  onUpload: (file: File) => void;
};

type UploadProps = {
  onRetry: () => void;
};

type RefusedProps = {
  onRetake: () => void;
  onUpload: (file: File) => void;
};

export function isDocumentReason(id: string | undefined): id is DocumentReason {
  return reasons.some((reason) => reason === id);
}

export function DocumentFailed({ reason, attempt, onRetake }: FailedProps) {
  const { content, t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const copy = content.document.result.failed.reasons[reason];

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen
      action={
        <Button className="w-full md:w-fit" onClick={onRetake}>
          {t("common.actions.retakePhoto")}
        </Button>
      }
    >
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("document.result.failed.title")}
      </h1>
      <Alert tone="danger" title={copy.intro}>
        <ul className="flex flex-col gap-1">
          {copy.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </Alert>
      <p className="text-sm font-medium">
        {t("common.attempt", { attempt, max: MAX_ATTEMPTS })}
      </p>
    </Screen>
  );
}

export function CameraBlocked({ error, onRetry, onUpload }: CameraProps) {
  const { content, t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const denied = error === "NotAllowedError";
  const copy = denied
    ? content.errors.CAMERA_DENIED
    : content.errors.CAMERA_NOT_FOUND;

  useLayoutEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen
      action={
        denied ? (
          <Button className="w-full md:w-fit" onClick={onRetry}>
            {t("errors.CAMERA_DENIED.cta")}
          </Button>
        ) : null
      }
    >
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {copy.title}
      </h1>
      <Alert tone="danger" title={copy.intro}>
        {denied ? (
          <ol className="list-decimal pl-5">
            {content.errors.CAMERA_DENIED.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : null}
      </Alert>
      <UploadInput
        label={
          denied
            ? t("errors.CAMERA_DENIED.fallback")
            : t("errors.CAMERA_NOT_FOUND.cta")
        }
        onUpload={onUpload}
      />
    </Screen>
  );
}

export function DocumentRefused({ onRetake, onUpload }: RefusedProps) {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen
      action={
        <Button className="w-full md:w-fit" onClick={onRetake}>
          {t("common.actions.retakePhoto")}
        </Button>
      }
    >
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("document.result.failed.title")}
      </h1>
      <UploadInput
        label={t("document.capture.uploadInstead")}
        onUpload={onUpload}
      />
    </Screen>
  );
}

export function UploadFailed({ onRetry }: UploadProps) {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen
      action={
        <Button className="w-full md:w-fit" onClick={onRetry}>
          {t("errors.UPLOAD_FAILED.cta")}
        </Button>
      }
    >
      <div role="alert" className="flex flex-col gap-6">
        <h1 ref={heading} tabIndex={-1} className={screenTitle}>
          {t("errors.UPLOAD_FAILED.message")}
        </h1>
        <p className="text-base leading-6">{t("errors.UPLOAD_FAILED.hint")}</p>
      </div>
    </Screen>
  );
}

function UploadInput({
  label,
  onUpload,
}: {
  label: string;
  onUpload: (file: File) => void;
}) {
  return (
    <label className="text-sm text-gold-strong underline">
      {label}
      <input
        className="mt-2 block text-ink"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) {
            onUpload(file);
          }
        }}
      />
    </label>
  );
}
