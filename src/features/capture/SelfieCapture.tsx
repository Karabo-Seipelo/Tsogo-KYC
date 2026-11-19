"use client";

import { useEffect, useRef, useState } from "react";
import { JourneyProgress } from "@/components/ui/JourneyProgress";
import { Screen } from "@/components/ui/Screen";
import {
  classes,
  focusRing,
  screenTitle,
  stateMotion,
} from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";
import { resizeImage } from "@/lib/image/resizeImage";
import { CameraBlocked } from "./DocumentFailed";
import { useCamera } from "./useCamera";

type Camera = Pick<ReturnType<typeof useCamera>, "start" | "stream" | "error">;

type Props = {
  onDone: (thumbnail: Blob) => void;
  camera?: Camera;
};

export function SelfieCapture({ onDone, camera }: Props) {
  const { t } = useContent();
  const video = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const owned = useCamera();
  const start = camera?.start ?? owned.start;
  const stream = camera ? camera.stream : owned.stream;
  const error = camera ? camera.error : owned.error;
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    if (camera || started.current) {
      return;
    }
    started.current = true;
    void owned.start("user");
  });

  useEffect(() => {
    if (video.current && stream) {
      video.current.srcObject = stream;
    }
  }, [stream]);

  async function uploadFrame(frame: Blob) {
    setUploading(true);
    try {
      const image = await resizeImage(frame, 1600, 0.8);
      const thumbnail = await resizeImage(frame, 320, 0.7);
      const form = new FormData();
      form.set("image", image, "image.jpg");
      form.set("thumbnail", thumbnail, "thumb.jpg");
      const response = await fetch("/api/session/selfie", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        setUploading(false);
        return;
      }
      onDone(thumbnail);
    } catch {
      setUploading(false);
    }
  }

  async function takeSelfie() {
    await uploadFrame(await captureFrame(video.current));
  }

  if (error && !uploading) {
    return (
      <CameraBlocked
        error={error}
        onRetry={() => {
          void start("user");
        }}
        onUpload={(file) => {
          void uploadFrame(file);
        }}
      />
    );
  }

  return (
    <Screen>
      <JourneyProgress step="selfie" />
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("selfie.title")}
      </h1>
      {uploading ? (
        <p role="status" aria-busy="true">
          {t("selfie.instruction")}
        </p>
      ) : (
        <p className="text-base leading-6">{t("selfie.instruction")}</p>
      )}
      <div className="relative overflow-hidden rounded-lg border border-ink bg-ink">
        <video
          ref={video}
          className="aspect-[3/4] w-full -scale-x-100 bg-ink object-cover"
          autoPlay
          muted
          playsInline
          aria-label={t("selfie.cameraAlt")}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[16%] right-[18%] bottom-[16%] left-[18%] rounded-[50%] border-2 border-dashed border-on-ink"
        />
      </div>
      {uploading ? null : (
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            className={classes(
              "flex flex-col items-center gap-2 text-sm text-ink",
              focusRing,
              stateMotion,
            )}
            onClick={() => {
              void takeSelfie();
            }}
          >
            <span
              aria-hidden="true"
              className="inline-flex size-18 items-center justify-center rounded-full bg-ink hover:opacity-[92%] active:opacity-[84%]"
            >
              <span className="size-14 rounded-full border-4 border-on-ink" />
            </span>
            {t("selfie.cta")}
          </button>
          <label className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-base text-ink">
            {t("common.actions.uploadPhotoInstead")}
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) {
                  void uploadFrame(file);
                }
              }}
            />
          </label>
        </div>
      )}
    </Screen>
  );
}

function captureFrame(video: HTMLVideoElement | null) {
  const canvas = document.createElement("canvas");
  const width = video?.videoWidth || 640;
  const height = video?.videoHeight || 480;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context && video) {
    context.drawImage(video, 0, 0, width, height);
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not capture the selfie"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.8,
    );
  });
}
