"use client";

import { useEffect, useRef } from "react";
import { useContent } from "@/lib/content/useContent";

type Props = {
  phase: "comparing" | "matched";
  documentSrc: string;
  selfieSrc: string;
  onContinue: () => void;
};

export function FaceMatch({
  phase,
  documentSrc,
  selfieSrc,
  onContinue,
}: Props) {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, [phase]);

  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {phase === "matched"
            ? t("faceMatch.matched.title")
            : t("faceMatch.title")}
        </h1>
        {phase === "comparing" ? (
          <>
            <p role="status">{t("faceMatch.comparing")}</p>
            <div className="flex gap-4">
              <Thumbnail
                src={documentSrc}
                label={t("faceMatch.documentPhoto")}
              />
              <Thumbnail src={selfieSrc} label={t("faceMatch.selfie")} />
            </div>
          </>
        ) : (
          <>
            <p className="text-base leading-6">{t("faceMatch.matched.body")}</p>
            <button
              type="button"
              className="w-full bg-neutral-950 px-4 py-3 text-white sm:w-fit"
              onClick={onContinue}
            >
              {t("common.actions.continue")}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

function Thumbnail({ src, label }: { src: string; label: string }) {
  return (
    <figure className="flex w-28 flex-col gap-2">
      {/* Session blob URLs are not static assets, so next/image cannot optimize them. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="aspect-square w-full border border-neutral-950 object-cover"
      />
      <figcaption className="text-sm">{label}</figcaption>
    </figure>
  );
}
