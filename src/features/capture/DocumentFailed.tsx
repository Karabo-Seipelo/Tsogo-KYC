"use client";

import { useEffect, useRef } from "react";
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
    <Screen>
      <h1
        ref={heading}
        tabIndex={-1}
        className="text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {t("document.result.failed.title")}
      </h1>
      <p className="text-base leading-6">{copy.intro}</p>
      <ul className="list-disc pl-5">
        {copy.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <p className="text-sm font-medium">
        {t("common.attempt", { attempt, max: MAX_ATTEMPTS })}
      </p>
      <button
        type="button"
        className="w-full bg-neutral-950 px-4 py-3 text-white sm:w-fit"
        onClick={onRetake}
      >
        {t("common.actions.retakePhoto")}
      </button>
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

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen>
      <div role="alert" className="flex flex-col gap-6">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {copy.title}
        </h1>
        <p className="text-base leading-6">{copy.intro}</p>
        {denied ? (
          <ol className="list-decimal pl-5">
            {content.errors.CAMERA_DENIED.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : null}
      </div>
      {denied ? (
        <button
          type="button"
          className="w-full bg-neutral-950 px-4 py-3 text-white sm:w-fit"
          onClick={onRetry}
        >
          {t("errors.CAMERA_DENIED.cta")}
        </button>
      ) : null}
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

export function UploadFailed({ onRetry }: UploadProps) {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen>
      <div role="alert" className="flex flex-col gap-6">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {t("errors.UPLOAD_FAILED.message")}
        </h1>
        <p className="text-base leading-6">{t("errors.UPLOAD_FAILED.hint")}</p>
      </div>
      <button
        type="button"
        className="w-full bg-neutral-950 px-4 py-3 text-white sm:w-fit"
        onClick={onRetry}
      >
        {t("errors.UPLOAD_FAILED.cta")}
      </button>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        {children}
      </div>
    </main>
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
    <label className="text-sm underline">
      {label}
      <input
        className="mt-2 block"
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
