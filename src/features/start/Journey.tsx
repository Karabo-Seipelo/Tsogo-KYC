"use client";

import { DocumentJourney } from "@/features/capture/DocumentJourney";
import { useKycMachine } from "@/machines/useKycMachine";
import { DeviceSelection } from "./DeviceSelection";
import { StartScreen } from "./StartScreen";

export function Journey() {
  const { state, send } = useKycMachine();

  if (state === "deviceSelection") {
    return (
      <DeviceSelection
        onChooseThisDevice={() => send({ type: "CHOOSE_THIS_DEVICE" })}
      />
    );
  }

  if (state === "documentUpload" || state === "documentValidation") {
    return <DocumentJourney send={send} />;
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
