"use client";

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

  if (state === "idle") {
    return (
      <StartScreen onStart={() => send({ type: "START", device: "desktop" })} />
    );
  }

  return <main />;
}
