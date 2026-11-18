"use client";

import { useState } from "react";
import type { DocumentKind } from "@/features/capture/DocumentType";
import { DocumentJourney } from "@/features/capture/DocumentJourney";
import { SelfieJourney } from "@/features/capture/SelfieJourney";
import { CompleteScreen } from "@/features/review/CompleteScreen";
import { ProcessingScreen } from "@/features/review/ProcessingScreen";
import { ReviewScreen, type ReviewCheck } from "@/features/review/ReviewScreen";
import { HelpProvider } from "@/features/help/HelpDialog";
import { SaveExitProvider } from "@/features/save-exit/SaveExit";
import { useKycMachine } from "@/machines/useKycMachine";
import { DeviceSelection } from "./DeviceSelection";
import { StartScreen } from "./StartScreen";

const blankPhoto =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export function Journey() {
  return (
    <SaveExitProvider>
      <HelpProvider>
        <JourneyFlow />
      </HelpProvider>
    </SaveExitProvider>
  );
}

function JourneyFlow() {
  const { state, send } = useKycMachine();
  const [documentPhoto, setDocumentPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentKind | null>(null);
  const [checks, setChecks] = useState<ReviewCheck[]>([]);

  if (state === "deviceSelection") {
    return (
      <DeviceSelection
        onChooseThisDevice={() => send({ type: "CHOOSE_THIS_DEVICE" })}
      />
    );
  }

  if (state === "documentUpload" || state === "documentValidation") {
    return (
      <DocumentJourney
        send={send}
        onThumbnail={(thumbnail) => {
          setDocumentPhoto((current) => {
            if (current) {
              URL.revokeObjectURL(current);
            }
            return URL.createObjectURL(thumbnail);
          });
        }}
        onDocumentType={setDocumentType}
        onChecks={setChecks}
      />
    );
  }

  if (
    state === "selfieCapture" ||
    state === "livenessCheck" ||
    state === "faceMatch"
  ) {
    return (
      <SelfieJourney
        documentSrc={documentPhoto}
        send={send}
        onSelfie={(src) => {
          setSelfiePhoto((current) => {
            if (current && current !== src) {
              URL.revokeObjectURL(current);
            }
            return src;
          });
        }}
      />
    );
  }

  if (state === "review" && documentType) {
    return (
      <ReviewScreen
        documentType={documentType}
        documentSrc={documentPhoto ?? blankPhoto}
        selfieSrc={selfiePhoto ?? blankPhoto}
        checks={checks}
        livenessPassed
        matched
        onRetake={(target) => send({ type: "RETAKE", target })}
        onSubmit={() => {
          void submitReview(send);
        }}
      />
    );
  }

  if (state === "processing") {
    return <ProcessingScreen onComplete={() => send({ type: "VERIFIED" })} />;
  }

  if (state === "complete") {
    return <CompleteScreen />;
  }

  if (state === "idle") {
    return (
      <StartScreen
        onStart={() => {
          void fetch("/api/session", { method: "POST" }).finally(() => {
            send({ type: "START", device: "desktop" });
          });
        }}
      />
    );
  }

  return <main />;
}

async function submitReview(send: (event: { type: "SUBMIT" }) => void) {
  try {
    const response = await fetch("/api/session/submit", { method: "POST" });
    if (!response.ok) {
      return;
    }
    send({ type: "SUBMIT" });
  } catch {
    return;
  }
}
