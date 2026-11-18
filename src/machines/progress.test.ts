import { createActor } from "xstate";
import { expect, test } from "vitest";
import { kycMachine } from "./kycMachine";
import type { KycEvent, KycState } from "./kycMachine.types";
import { progressFor, progressSteps } from "./progress";

test("AC-01.9 progressSteps is the one ordered verification list", () => {
  expect(progressSteps.map((step) => step.step)).toEqual([
    "document",
    "selfie",
    "liveness",
    "review",
  ]);
});

test("AC-01.9 document states are step 1 of the list", () => {
  for (const state of ["documentUpload", "documentValidation"] as const) {
    expect(progressFor(state)).toEqual({
      current: 1,
      total: progressSteps.length,
      step: "document",
    });
  }
});

test("AC-01.9 selfie, liveness and review follow the list", () => {
  expect(progressFor("selfieCapture")).toEqual({
    current: 2,
    total: progressSteps.length,
    step: "selfie",
  });
  expect(progressFor("livenessCheck")).toEqual({
    current: 3,
    total: progressSteps.length,
    step: "liveness",
  });
  expect(progressFor("faceMatch")).toEqual({
    current: 3,
    total: progressSteps.length,
    step: "liveness",
  });
  expect(progressFor("review")).toEqual({
    current: 4,
    total: progressSteps.length,
    step: "review",
  });
});

const noCounter: KycState[] = [
  "idle",
  "deviceSelection",
  "qrHandoff",
  "processing",
  "complete",
  "error",
];

test.each(noCounter)("AC-01.9 %s shows no counter", (state) => {
  expect(progressFor(state)).toBeNull();
});

const paths: [string, KycEvent[]][] = [
  [
    "desktop only",
    [{ type: "START", device: "desktop" }, { type: "CHOOSE_THIS_DEVICE" }],
  ],
  [
    "desktop to phone",
    [
      { type: "START", device: "desktop" },
      { type: "CHOOSE_PHONE" },
      { type: "PHONE_CONNECTED" },
    ],
  ],
  ["mobile only", [{ type: "START", device: "phone" }]],
];

test.each(paths)(
  "AC-01.9 the %s path reaches documentUpload on step 1",
  (_name, events) => {
    const actor = createActor(kycMachine).start();
    for (const event of events) {
      actor.send(event);
    }

    expect(actor.getSnapshot().value).toBe("documentUpload");
    expect(progressFor("documentUpload")).toEqual({
      current: 1,
      total: progressSteps.length,
      step: "document",
    });
  },
);
