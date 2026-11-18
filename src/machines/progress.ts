import type { KycState } from "./kycMachine.types";

type ProgressStep = {
  step: "document" | "selfie" | "liveness" | "review";
  states: readonly KycState[];
};

export const progressSteps: readonly ProgressStep[] = [
  {
    step: "document",
    states: ["documentUpload", "documentValidation"],
  },
  { step: "selfie", states: ["selfieCapture"] },
  { step: "liveness", states: ["livenessCheck", "faceMatch"] },
  { step: "review", states: ["review"] },
];

export function progressFor(state: KycState) {
  const index = progressSteps.findIndex((entry) =>
    entry.states.includes(state),
  );
  const entry = progressSteps[index];
  if (!entry) {
    return null;
  }
  return {
    current: index + 1,
    total: progressSteps.length,
    step: entry.step,
  };
}
