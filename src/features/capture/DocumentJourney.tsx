"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/useContent";
import { resizeImage } from "@/lib/image/resizeImage";
import { DocumentCapture } from "./DocumentCapture";
import { DocumentPassed } from "./DocumentPassed";
import { DocumentType, type DocumentChoice } from "./DocumentType";

type Phase = "type" | "capture" | "checking" | "passed";

type DocumentEvent =
  | { type: "DOC_CAPTURED" }
  | { type: "DOC_VALID" }
  | { type: "DOC_INVALID" }
  | { type: "UPLOAD_FAILED" };

type Props = {
  send: (event: DocumentEvent) => void;
  onThumbnail?: (thumbnail: Blob) => void;
};

export function DocumentJourney({ send, onThumbnail }: Props) {
  const { content } = useContent();
  const [choice, setChoice] = useState<DocumentChoice | null>(null);
  const [phase, setPhase] = useState<Phase>("type");
  const [side, setSide] = useState(1);

  async function submit(file?: File) {
    if (!choice) {
      return;
    }
    if (side < choice.sides) {
      setSide(side + 1);
      return;
    }

    setPhase("checking");
    try {
      const upload = await documentForm(file, side);
      onThumbnail?.(upload.thumbnail);
      const response = await fetch("/api/session/document", {
        method: "POST",
        body: upload.form,
      });
      if (!response.ok) {
        send({ type: "UPLOAD_FAILED" });
        setPhase("capture");
        return;
      }
      const body = (await response.json()) as { passed?: boolean };
      send({ type: "DOC_CAPTURED" });
      if (body.passed) {
        setPhase("passed");
        return;
      }
      send({ type: "DOC_INVALID" });
      setSide(1);
      setPhase("capture");
    } catch {
      send({ type: "UPLOAD_FAILED" });
      setPhase("capture");
    }
  }

  if (!choice || phase === "type") {
    return (
      <DocumentType
        onChoose={setChoice}
        onContinue={(next) => {
          setChoice(next);
          setSide(1);
          setPhase("capture");
        }}
      />
    );
  }

  if (phase === "passed") {
    return (
      <DocumentPassed
        checks={[
          {
            id: "corners",
            label: content.document.result.passed.checks.corners,
            passed: true,
          },
          {
            id: "readable",
            label: content.document.result.passed.checks.readable,
            passed: true,
          },
          {
            id: "notExpired",
            label: content.document.result.passed.checks.notExpired,
            passed: true,
          },
        ]}
        onContinue={() => send({ type: "DOC_VALID" })}
        onRetake={() => {
          setSide(1);
          setPhase("capture");
        }}
      />
    );
  }

  return (
    <DocumentCapture
      side={side}
      total={choice.sides}
      checking={phase === "checking"}
      onCapture={(file) => {
        void submit(file);
      }}
    />
  );
}

async function documentForm(file: File | undefined, side: number) {
  const source = file ?? new Blob(["photo"], { type: "image/jpeg" });
  const image = file ? await resizeImage(file, 1600, 0.8) : source;
  const thumbnail = file ? await resizeImage(file, 320, 0.7) : source;
  const form = new FormData();
  form.set("side", side === 1 ? "front" : "back");
  form.set("image", image, "image.jpg");
  form.set("thumbnail", thumbnail, "thumb.jpg");
  return { form, thumbnail };
}
