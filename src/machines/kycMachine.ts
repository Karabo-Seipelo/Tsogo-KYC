import { assign, setup } from "xstate";
import type { KycContext, KycEvent } from "./kycMachine.types";

// Named sources and ordered guards. The first matching guard wins, and the
// last entry is the default. Source: https://stately.ai/docs/setup and
// https://stately.ai/docs/guards
export const MAX_ATTEMPTS = 3;

function initialContext(): KycContext {
  return {
    documentType: null,
    docAttempts: 0,
    matchAttempts: 0,
    device: null,
    cameraError: false,
    uploadError: false,
    offline: false,
    timeoutWarning: false,
    reason: null,
  };
}

const sessionExpired = {
  target: "error",
  actions: "setSessionExpired",
} as const;

export const kycMachine = setup({
  types: {
    context: {} as KycContext,
    events: {} as KycEvent,
  },
  guards: {
    isPhone: ({ event }) => event.type === "START" && event.device === "phone",
    retakeDocument: ({ event }) =>
      event.type === "RETAKE" && event.target === "document",
    canRetryDoc: ({ context }) => context.docAttempts + 1 < MAX_ATTEMPTS,
    canRetryMatch: ({ context }) => context.matchAttempts + 1 < MAX_ATTEMPTS,
  },
  actions: {
    setDevice: assign({
      device: ({ event }) => (event.type === "START" ? event.device : null),
    }),
    incrementDocAttempts: assign({
      docAttempts: ({ context }) => context.docAttempts + 1,
    }),
    incrementMatchAttempts: assign({
      matchAttempts: ({ context }) => context.matchAttempts + 1,
    }),
    docMaxAttempts: assign({
      docAttempts: ({ context }) => context.docAttempts + 1,
      reason: "maxAttempts",
    }),
    matchMaxAttempts: assign({
      matchAttempts: ({ context }) => context.matchAttempts + 1,
      reason: "maxAttempts",
    }),
    setSessionExpired: assign({
      reason: "sessionExpired",
    }),
    reset: assign(initialContext),
  },
}).createMachine({
  id: "kyc",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        START: [
          {
            guard: "isPhone",
            target: "documentUpload",
            actions: "setDevice",
          },
          { target: "deviceSelection", actions: "setDevice" },
        ],
        SESSION_EXPIRED: sessionExpired,
      },
    },
    deviceSelection: {
      on: {
        CHOOSE_PHONE: { target: "qrHandoff" },
        CHOOSE_THIS_DEVICE: { target: "documentUpload" },
        SESSION_EXPIRED: sessionExpired,
      },
    },
    qrHandoff: {
      on: {
        PHONE_CONNECTED: { target: "documentUpload" },
        SESSION_EXPIRED: sessionExpired,
      },
    },
    documentUpload: {
      on: {
        DOC_CAPTURED: { target: "documentValidation" },
        SESSION_EXPIRED: sessionExpired,
      },
    },
    documentValidation: {
      on: {
        DOC_VALID: { target: "selfieCapture" },
        DOC_INVALID: [
          {
            guard: "canRetryDoc",
            target: "documentUpload",
            actions: "incrementDocAttempts",
          },
          { target: "error", actions: "docMaxAttempts" },
        ],
        SESSION_EXPIRED: sessionExpired,
      },
    },
    selfieCapture: {
      on: {
        SELFIE_CAPTURED: { target: "livenessCheck" },
        SESSION_EXPIRED: sessionExpired,
      },
    },
    livenessCheck: {
      on: {
        LIVENESS_PASSED: { target: "faceMatch" },
        SESSION_EXPIRED: sessionExpired,
      },
    },
    faceMatch: {
      on: {
        MATCHED: { target: "review" },
        NO_MATCH: [
          {
            guard: "canRetryMatch",
            target: "selfieCapture",
            actions: "incrementMatchAttempts",
          },
          { target: "error", actions: "matchMaxAttempts" },
        ],
        SESSION_EXPIRED: sessionExpired,
      },
    },
    review: {
      on: {
        SUBMIT: { target: "processing" },
        RETAKE: [
          { guard: "retakeDocument", target: "documentUpload" },
          { target: "selfieCapture" },
        ],
        SESSION_EXPIRED: sessionExpired,
      },
    },
    processing: {
      on: {
        VERIFIED: { target: "complete" },
        REJECTED: { target: "error" },
        SESSION_EXPIRED: sessionExpired,
      },
    },
    complete: { type: "final" },
    error: {
      on: {
        RESTART: { target: "idle", actions: "reset" },
      },
    },
  },
});
