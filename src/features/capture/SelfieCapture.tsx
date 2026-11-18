"use client";

import { useEffect, useRef, useState } from "react";
import { useContent } from "@/lib/content/useContent";
import { resizeImage } from "@/lib/image/resizeImage";
import { useCamera } from "./useCamera";

type Props = {
  onDone: (thumbnail: Blob) => void;
};

export function SelfieCapture({ onDone }: Props) {
  const { t } = useContent();
  const video = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const { start, stream } = useCamera();
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

  async function takeSelfie() {
    setUploading(true);
    try {
      const frame = await captureFrame(video.current);
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

  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {t("selfie.title")}
        </h1>
        {uploading ? (
          <p role="status" aria-busy="true">
            {t("selfie.instruction")}
          </p>
        ) : (
          <p className="text-base leading-6">{t("selfie.instruction")}</p>
        )}
        <div className="relative border-2 border-neutral-950 p-3">
          <video
            ref={video}
            className="aspect-[3/4] w-full -scale-x-100 bg-neutral-100 object-cover"
            autoPlay
            muted
            playsInline
            aria-label={t("selfie.cameraAlt")}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-[16%] right-[18%] bottom-[16%] left-[18%] rounded-[50%] border-2 border-neutral-950"
          />
        </div>
        {uploading ? null : (
          <button
            type="button"
            className="w-full bg-neutral-950 px-4 py-3 text-white sm:w-fit"
            onClick={() => {
              void takeSelfie();
            }}
          >
            {t("selfie.cta")}
          </button>
        )}
      </div>
    </main>
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
