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

  if (state === "documentUpload") {
    return <DocumentJourney />;
  }

  if (state === "idle") {
    return (
      <StartScreen onStart={() => send({ type: "START", device: "desktop" })} />
    );
  }

  return <main />;
}
