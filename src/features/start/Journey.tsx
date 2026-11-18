"use client";

import { useState } from "react";
import { DocumentJourney } from "@/features/capture/DocumentJourney";
import { SelfieJourney } from "@/features/capture/SelfieJourney";
import { useKycMachine } from "@/machines/useKycMachine";
import { DeviceSelection } from "./DeviceSelection";
import { StartScreen } from "./StartScreen";

export function Journey() {
  const { state, send } = useKycMachine();
  const [documentPhoto, setDocumentPhoto] = useState<string | null>(null);

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
      />
    );
  }

  if (state === "selfieCapture") {
    return <SelfieJourney documentSrc={documentPhoto} />;
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
