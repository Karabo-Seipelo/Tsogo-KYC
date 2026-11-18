"use client";

import { useEffect, useRef } from "react";
import { useContent } from "@/lib/content/useContent";
import { useCamera } from "./useCamera";

type Props = {
  side: number;
  total: number;
  checking: boolean;
  onCapture: () => void;
};

export function DocumentCapture({ side, total, checking, onCapture }: Props) {
  const { t } = useContent();
  const video = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const { start, stream } = useCamera();

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

  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("document.capture.title")}
        </h1>
        {total > 1 ? (
          <p className="text-sm font-medium">
            {t("document.capture.sideLabel", { side, total })}
          </p>
        ) : null}
        <p className="text-base leading-6">
          {t("document.capture.instruction")}
        </p>
        {checking ? (
          <p role="status">{t("document.checking")}</p>
        ) : (
          <div className="border-2 border-neutral-950 p-3">
            <video
              ref={video}
              className="aspect-[3/4] w-full bg-neutral-100 object-cover"
              autoPlay
              muted
              playsInline
              aria-label={t("document.capture.cameraAlt")}
            />
          </div>
        )}
        {checking ? null : (
          <button
            type="button"
            className="w-full bg-neutral-950 px-4 py-3 text-white sm:w-fit"
            onClick={onCapture}
          >
            {t("document.capture.takePhoto")}
          </button>
        )}
        <label className="text-sm underline">
          {t("document.capture.uploadInstead")}
          <input
            className="mt-2 block"
            type="file"
            accept="image/*"
            onChange={(event) => {
              if (event.currentTarget.files?.[0]) {
                onCapture();
              }
            }}
          />
        </label>
      </div>
    </main>
  );
}
