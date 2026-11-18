"use client";

import { useRef, useState } from "react";
import { useContent } from "@/lib/content/useContent";
import type { Content } from "@/lib/content/schema";
import { resizeImage } from "@/lib/image/resizeImage";
import { DocumentCapture } from "./DocumentCapture";
import {
  DocumentFailed,
  UploadFailed,
  isDocumentReason,
  type DocumentReason,
} from "./DocumentFailed";
import { DocumentPassed } from "./DocumentPassed";
import { DocumentType, type DocumentChoice } from "./DocumentType";

type Phase =
  "type" | "capture" | "checking" | "passed" | "failed" | "uploadFailed";

type DocumentEvent =
  | { type: "DOC_CAPTURED" }
  | { type: "DOC_VALID" }
  | { type: "DOC_INVALID" }
  | { type: "UPLOAD_FAILED" };

type PassedCheck = {
  id: string;
  label: string;
  passed: boolean;
};

type Props = {
  send: (event: DocumentEvent) => void;
  onThumbnail?: (thumbnail: Blob) => void;
  onDocumentType?: (type: DocumentChoice["type"]) => void;
  onChecks?: (checks: PassedCheck[]) => void;
};

export function DocumentJourney({
  send,
  onThumbnail,
  onDocumentType,
  onChecks,
}: Props) {
  const { content } = useContent();
  const [choice, setChoice] = useState<DocumentChoice | null>(null);
  const [phase, setPhase] = useState<Phase>("type");
  const [side, setSide] = useState(1);
  const [reason, setReason] = useState<DocumentReason>("blurry");
  const [attempt, setAttempt] = useState(1);
  const saved = useRef<SavedPhoto | null>(null);
  const failures = useRef(0);

  async function submit(file?: File) {
    if (!choice) {
      return;
    }
    if (side < choice.sides) {
      setSide(side + 1);
      return;
    }

    const upload = await documentForm(file, side);
    saved.current = upload;
    await sendPhoto(upload);
  }

  async function sendPhoto(upload: SavedPhoto) {
    setPhase("checking");
    onThumbnail?.(upload.thumbnail);
    const result = await postDocument(upload);
    if (!result.ok) {
      send({ type: "UPLOAD_FAILED" });
      setPhase("uploadFailed");
      return;
    }
    send({ type: "DOC_CAPTURED" });
    if (result.body.passed) {
      onChecks?.(documentChecks(content));
      setPhase("passed");
      return;
    }
    const failed = result.body.checks?.find((check) => !check.passed);
    setReason(isDocumentReason(failed?.id) ? failed.id : "blurry");
    failures.current += 1;
    setAttempt(failures.current);
    send({ type: "DOC_INVALID" });
    setSide(1);
    setPhase("failed");
  }

  if (!choice || phase === "type") {
    return (
      <DocumentType
        onChoose={setChoice}
        onContinue={(next) => {
          setChoice(next);
          setSide(1);
          setPhase("capture");
          onDocumentType?.(next.type);
        }}
      />
    );
  }

  if (phase === "failed") {
    return (
      <DocumentFailed
        reason={reason}
        attempt={attempt}
        onRetake={() => {
          setSide(1);
          setPhase("capture");
        }}
      />
    );
  }

  if (phase === "uploadFailed" && saved.current) {
    const upload = saved.current;
    return (
      <UploadFailed
        onRetry={() => {
          void sendPhoto(upload);
        }}
      />
    );
  }

  if (phase === "passed") {
    return (
      <DocumentPassed
        checks={documentChecks(content)}
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

function documentChecks(content: Content): PassedCheck[] {
  return [
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
  ];
}

type SavedPhoto = {
  image: Blob;
  thumbnail: Blob;
  side: number;
};

type DocumentBody = {
  passed?: boolean;
  checks?: PassedCheck[];
};

const retryDelays = [0, 20, 40];

async function postDocument(photo: SavedPhoto) {
  for (const wait of retryDelays) {
    if (wait > 0) {
      await delay(wait);
    }
    try {
      const response = await fetch("/api/session/document", {
        method: "POST",
        body: documentBody(photo),
      });
      if (response.ok) {
        return {
          ok: true as const,
          body: (await response.json()) as DocumentBody,
        };
      }
    } catch {
      // The next wait is longer, then the saved photo can be sent again.
    }
  }
  return { ok: false as const };
}

function documentBody(photo: SavedPhoto) {
  const form = new FormData();
  form.set("side", photo.side === 1 ? "front" : "back");
  form.set("image", photo.image, "image.jpg");
  form.set("thumbnail", photo.thumbnail, "thumb.jpg");
  return form;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function documentForm(file: File | undefined, side: number) {
  const source = file ?? new Blob(["photo"], { type: "image/jpeg" });
  const image = file ? await resizeImage(file, 1600, 0.8) : source;
  const thumbnail = file ? await resizeImage(file, 320, 0.7) : source;
  return { image, thumbnail, side };
}
