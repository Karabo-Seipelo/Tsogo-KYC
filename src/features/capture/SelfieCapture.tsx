"use client";

import { useEffect, useRef, useState } from "react";
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

type Props = {
  onDone: (thumbnail: Blob) => void;
};

export function SelfieCapture({ onDone }: Props) {
  const { t } = useContent();
  const video = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const { start, stream, error } = useCamera();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    void start("user");
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
    <Screen
      action={
        uploading ? null : (
          <div className="flex justify-center md:justify-start">
            <button
              type="button"
              className={classes(
                "inline-flex size-18 items-center justify-center rounded-full bg-ink",
                "hover:opacity-[92%] active:opacity-[84%]",
                focusRing,
                stateMotion,
              )}
              aria-label={t("selfie.cta")}
              onClick={() => {
                void takeSelfie();
              }}
            >
              <span className="sr-only">{t("selfie.cta")}</span>
              <span
                aria-hidden="true"
                className="size-14 rounded-full border-4 border-on-ink"
              />
            </button>
          </div>
        )
      }
    >
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
