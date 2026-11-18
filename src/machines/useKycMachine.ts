"use client";

import { useMachine } from "@xstate/react";
import { kycMachine } from "./kycMachine";
import { progressFor } from "./progress";

// useMachine keeps one actor for the component and returns its snapshot and
// send. Source: https://stately.ai/docs/xstate-react
export function useKycMachine() {
  const [snapshot, send] = useMachine(kycMachine);
  return {
    state: snapshot.value,
    send,
    reason: snapshot.context.reason,
    stepNumber: progressFor(snapshot.value)?.current ?? null,
  };
}
