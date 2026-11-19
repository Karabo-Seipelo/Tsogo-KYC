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
    beginSession: assign(({ event }) => ({
      ...initialContext(),
      device: event.type === "START" ? event.device : null,
    })),
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
            actions: "beginSession",
          },
          { target: "deviceSelection", actions: "beginSession" },
        ],
        SESSION_EXPIRED: { target: "error", actions: "setSessionExpired" },
      },
    },
    deviceSelection: {
      on: {
        CHOOSE_PHONE: { target: "qrHandoff" },
        CHOOSE_THIS_DEVICE: { target: "documentUpload" },
        SESSION_EXPIRED: { target: "error", actions: "setSessionExpired" },
      },
    },
    qrHandoff: {
      on: {
        PHONE_CONNECTED: { target: "documentUpload" },
        CHOOSE_THIS_DEVICE: { target: "documentUpload" },
        HANDBACK: { target: "review" },
        SESSION_EXPIRED: { target: "error", actions: "setSessionExpired" },
      },
    },
    documentUpload: {
      on: {
        DOC_CAPTURED: { target: "documentValidation" },
        SESSION_EXPIRED: { target: "error", actions: "setSessionExpired" },
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
        SESSION_EXPIRED: { target: "error", actions: "setSessionExpired" },
      },
    },
    selfieCapture: {
      on: {
        SELFIE_CAPTURED: { target: "livenessCheck" },
        RETAKE: {
          guard: "retakeDocument",
          target: "documentUpload",
        },
        SESSION_EXPIRED: { target: "error", actions: "setSessionExpired" },
      },
    },
    livenessCheck: {
      on: {
        LIVENESS_PASSED: { target: "faceMatch" },
        SESSION_EXPIRED: { target: "error", actions: "setSessionExpired" },
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
        SESSION_EXPIRED: { target: "error", actions: "setSessionExpired" },
      },
    },
    review: {
      on: {
        SUBMIT: { target: "processing" },
        RETAKE: [
          { guard: "retakeDocument", target: "documentUpload" },
          { target: "selfieCapture" },
        ],
        SESSION_EXPIRED: { target: "error", actions: "setSessionExpired" },
      },
    },
    processing: {
      on: {
        VERIFIED: { target: "complete" },
        REJECTED: { target: "error" },
        SESSION_EXPIRED: { target: "error", actions: "setSessionExpired" },
      },
    },
    complete: {
      on: {
        RESTART: { target: "idle", actions: "reset" },
        START: [
          {
            guard: "isPhone",
            target: "documentUpload",
            actions: "beginSession",
          },
          { target: "deviceSelection", actions: "beginSession" },
        ],
      },
    },
    error: {
      on: {
        RESTART: { target: "idle", actions: "reset" },
      },
    },
  },
});
