"use client";

import { useEffect, useRef } from "react";
import { Screen } from "@/components/ui/Screen";
import {
  classes,
  focusRing,
  screenTitle,
  stateMotion,
} from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";
import { CameraBlocked } from "./DocumentFailed";
import { useCamera } from "./useCamera";

type Props = {
  side: number;
  total: number;
  checking: boolean;
  onCapture: (file?: File) => void;
};

export function DocumentCapture({ side, total, checking, onCapture }: Props) {
  const { t } = useContent();
  const video = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const { start, stream, error } = useCamera();

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    void start();
  });

  useEffect(() => {
    if (video.current && stream) {
      video.current.srcObject = stream;
    }
  }, [stream]);

  if (!checking && error) {
    return (
      <CameraBlocked
        error={error}
        onRetry={() => {
          void start();
        }}
        onUpload={(file) => onCapture(file)}
      />
    );
  }

  const sideLabel =
    total > 1 ? t("document.capture.sideLabel", { side, total }) : null;

  return (
    <Screen
      action={
        checking ? null : (
          <div className="flex justify-center">
            <button
              type="button"
              className={classes(
                "inline-flex size-18 items-center justify-center rounded-full bg-ink",
                "hover:opacity-[92%] active:opacity-[84%]",
                focusRing,
                stateMotion,
              )}
              aria-label={t("document.capture.takePhoto")}
              onClick={() => onCapture()}
            >
              <span className="sr-only">{t("document.capture.takePhoto")}</span>
              <span
                aria-hidden="true"
                className="size-14 rounded-full border-4 border-on-ink"
              />
            </button>
          </div>
        )
      }
    >
      <h1 className={screenTitle}>{t("document.capture.title")}</h1>
      <p className="text-base leading-6">{t("document.capture.instruction")}</p>
      {checking ? (
        <p role="status">{t("document.checking")}</p>
      ) : (
        <div className="relative overflow-hidden rounded-lg border border-ink bg-ink">
          <video
            ref={video}
            className="aspect-[3/4] w-full bg-ink object-cover"
            autoPlay
            muted
            playsInline
            aria-label={t("document.capture.cameraAlt")}
          />
          <CornerGuides />
          {sideLabel ? (
            <span className="absolute top-4 left-4 rounded-sm bg-surface px-2 py-1 text-xs font-medium text-ink">
              {sideLabel}
            </span>
          ) : null}
        </div>
      )}
      <UploadInstead
        label={t("document.capture.uploadInstead")}
        onUpload={(file) => onCapture(file)}
      />
    </Screen>
  );
}

function CornerGuides() {
  const corner =
    "pointer-events-none absolute size-6 border-on-ink border-t-2 border-l-2";
  return (
    <div aria-hidden="true">
      <span className={`${corner} top-3 left-3`} />
      <span className={`${corner} top-3 right-3 -scale-x-100`} />
      <span className={`${corner} bottom-3 left-3 -scale-y-100`} />
      <span
        className={`${corner} right-3 bottom-3 -scale-x-100 -scale-y-100`}
      />
    </div>
  );
}

function UploadInstead({
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
