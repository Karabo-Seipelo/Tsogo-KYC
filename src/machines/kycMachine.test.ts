import { createActor } from "xstate";
import { expect, test } from "vitest";
import { kycMachine } from "./kycMachine";
import type { KycContext, KycEvent, KycState } from "./kycMachine.types";

const initialContext: KycContext = {
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

const desktop: KycEvent = { type: "START", device: "desktop" };
const thisDevice: KycEvent = { type: "CHOOSE_THIS_DEVICE" };
const captured: KycEvent = { type: "DOC_CAPTURED" };
const invalid: KycEvent = { type: "DOC_INVALID" };
const valid: KycEvent = { type: "DOC_VALID" };
const selfie: KycEvent = { type: "SELFIE_CAPTURED" };
const liveness: KycEvent = { type: "LIVENESS_PASSED" };
const matched: KycEvent = { type: "MATCHED" };

const toDocumentValidation: KycEvent[] = [desktop, thisDevice, captured];
const toSelfieCapture: KycEvent[] = [...toDocumentValidation, valid];
const toFaceMatch: KycEvent[] = [...toSelfieCapture, selfie, liveness];
const toReview: KycEvent[] = [...toFaceMatch, matched];
const toProcessing: KycEvent[] = [...toReview, { type: "SUBMIT" }];

function journey(events: KycEvent[]) {
  const actor = createActor(kycMachine).start();
  for (const event of events) {
    actor.send(event);
  }
  return actor;
}

test("AC-01.1 START on desktop goes to deviceSelection", () => {
  const actor = journey([desktop]);

  expect(actor.getSnapshot().value).toBe("deviceSelection");
  expect(actor.getSnapshot().context.device).toBe("desktop");
});

test("AC-01.1 START on mobile goes to documentUpload", () => {
  const actor = journey([{ type: "START", device: "phone" }]);

  expect(actor.getSnapshot().value).toBe("documentUpload");
  expect(actor.getSnapshot().context.device).toBe("phone");
});

test("deviceSelection CHOOSE_PHONE goes to qrHandoff", () => {
  const actor = journey([desktop, { type: "CHOOSE_PHONE" }]);

  expect(actor.getSnapshot().value).toBe("qrHandoff");
});

test("AC-01.2 CHOOSE_THIS_DEVICE skips the QR handoff", () => {
  const actor = journey([desktop, thisDevice]);

  expect(actor.getSnapshot().value).toBe("documentUpload");
});

test("AC-01.10 CHOOSE_THIS_DEVICE from the QR screen goes to documentUpload", () => {
  const actor = journey([desktop, { type: "CHOOSE_PHONE" }, thisDevice]);

  expect(actor.getSnapshot().value).toBe("documentUpload");
});

test("qrHandoff PHONE_CONNECTED goes to documentUpload", () => {
  const actor = journey([
    desktop,
    { type: "CHOOSE_PHONE" },
    { type: "PHONE_CONNECTED" },
  ]);

  expect(actor.getSnapshot().value).toBe("documentUpload");
});

test("documentUpload DOC_CAPTURED goes to documentValidation", () => {
  const actor = journey(toDocumentValidation);

  expect(actor.getSnapshot().value).toBe("documentValidation");
});

test("documentValidation DOC_VALID goes to selfieCapture", () => {
  const actor = journey(toSelfieCapture);

  expect(actor.getSnapshot().value).toBe("selfieCapture");
});

test("AC-01.3 the first DOC_INVALID returns to documentUpload", () => {
  const actor = journey(toDocumentValidation);
  expect(actor.getSnapshot().context.docAttempts).toBe(0);

  actor.send(invalid);

  expect(actor.getSnapshot().value).toBe("documentUpload");
  expect(actor.getSnapshot().context.docAttempts).toBe(1);
});

test("AC-01.3 the second DOC_INVALID returns to documentUpload", () => {
  const actor = journey([...toDocumentValidation, invalid, captured]);
  expect(actor.getSnapshot().value).toBe("documentValidation");
  expect(actor.getSnapshot().context.docAttempts).toBe(1);

  actor.send(invalid);

  expect(actor.getSnapshot().value).toBe("documentUpload");
  expect(actor.getSnapshot().context.docAttempts).toBe(2);
});

test("AC-01.4 the third DOC_INVALID goes to error with maxAttempts", () => {
  const actor = journey([
    ...toDocumentValidation,
    invalid,
    captured,
    invalid,
    captured,
  ]);
  expect(actor.getSnapshot().value).toBe("documentValidation");
  expect(actor.getSnapshot().context.docAttempts).toBe(2);

  actor.send(invalid);

  expect(actor.getSnapshot().value).toBe("error");
  expect(actor.getSnapshot().context.reason).toBe("maxAttempts");
});

test("selfieCapture SELFIE_CAPTURED goes to livenessCheck", () => {
  const actor = journey([...toSelfieCapture, selfie]);

  expect(actor.getSnapshot().value).toBe("livenessCheck");
});

test("livenessCheck LIVENESS_PASSED goes to faceMatch", () => {
  const actor = journey(toFaceMatch);

  expect(actor.getSnapshot().value).toBe("faceMatch");
});

test("faceMatch MATCHED goes to review", () => {
  const actor = journey(toReview);

  expect(actor.getSnapshot().value).toBe("review");
});

test("AC-01.5 the first NO_MATCH returns to selfieCapture", () => {
  const actor = journey(toFaceMatch);
  expect(actor.getSnapshot().context.matchAttempts).toBe(0);

  actor.send({ type: "NO_MATCH" });

  expect(actor.getSnapshot().value).toBe("selfieCapture");
  expect(actor.getSnapshot().context.matchAttempts).toBe(1);
});

test("AC-01.5 the second NO_MATCH returns to selfieCapture", () => {
  const actor = journey([
    ...toFaceMatch,
    { type: "NO_MATCH" },
    selfie,
    liveness,
  ]);
  expect(actor.getSnapshot().value).toBe("faceMatch");
  expect(actor.getSnapshot().context.matchAttempts).toBe(1);

  actor.send({ type: "NO_MATCH" });

  expect(actor.getSnapshot().value).toBe("selfieCapture");
  expect(actor.getSnapshot().context.matchAttempts).toBe(2);
});

test("AC-04.7 RETAKE document from the selfie returns to the document", () => {
  const actor = journey([...toFaceMatch, { type: "NO_MATCH" }]);
  expect(actor.getSnapshot().value).toBe("selfieCapture");

  actor.send({ type: "RETAKE", target: "document" });

  expect(actor.getSnapshot().value).toBe("documentUpload");
  expect(actor.getSnapshot().context.matchAttempts).toBe(1);
});

test("AC-01.5 the third NO_MATCH goes to error with maxAttempts", () => {
  const actor = journey([
    ...toFaceMatch,
    { type: "NO_MATCH" },
    selfie,
    liveness,
    { type: "NO_MATCH" },
    selfie,
    liveness,
  ]);
  expect(actor.getSnapshot().value).toBe("faceMatch");
  expect(actor.getSnapshot().context.matchAttempts).toBe(2);

  actor.send({ type: "NO_MATCH" });

  expect(actor.getSnapshot().value).toBe("error");
  expect(actor.getSnapshot().context.reason).toBe("maxAttempts");
});

test("review SUBMIT goes to processing", () => {
  const actor = journey(toProcessing);

  expect(actor.getSnapshot().value).toBe("processing");
});

test("AC-01.7 RETAKE document returns to documentUpload and keeps captured data", () => {
  const actor = journey([
    ...toDocumentValidation,
    invalid,
    captured,
    valid,
    selfie,
    liveness,
    matched,
  ]);
  expect(actor.getSnapshot().value).toBe("review");
  expect(actor.getSnapshot().context.docAttempts).toBe(1);

  actor.send({ type: "RETAKE", target: "document" });

  expect(actor.getSnapshot().value).toBe("documentUpload");
  expect(actor.getSnapshot().context.docAttempts).toBe(1);
  expect(actor.getSnapshot().context.device).toBe("desktop");
  expect(actor.getSnapshot().context.matchAttempts).toBe(0);
});

test("AC-01.7 RETAKE selfie returns to selfieCapture and keeps captured data", () => {
  const actor = journey([
    ...toDocumentValidation,
    invalid,
    captured,
    valid,
    selfie,
    liveness,
    matched,
  ]);

  actor.send({ type: "RETAKE", target: "selfie" });

  expect(actor.getSnapshot().value).toBe("selfieCapture");
  expect(actor.getSnapshot().context.docAttempts).toBe(1);
  expect(actor.getSnapshot().context.device).toBe("desktop");
});

test("processing VERIFIED goes to complete", () => {
  const actor = journey([...toProcessing, { type: "VERIFIED" }]);

  expect(actor.getSnapshot().value).toBe("complete");
});

test("processing REJECTED goes to error", () => {
  const actor = journey([...toProcessing, { type: "REJECTED" }]);

  expect(actor.getSnapshot().value).toBe("error");
});

const nonFinal: [KycState, KycEvent[]][] = [
  ["idle", []],
  ["deviceSelection", [desktop]],
  ["qrHandoff", [desktop, { type: "CHOOSE_PHONE" }]],
  ["documentUpload", [desktop, thisDevice]],
  ["documentValidation", toDocumentValidation],
  ["selfieCapture", toSelfieCapture],
  ["livenessCheck", [...toSelfieCapture, selfie]],
  ["faceMatch", toFaceMatch],
  ["review", toReview],
  ["processing", toProcessing],
];

test.each(nonFinal)(
  "AC-01.6 SESSION_EXPIRED from %s goes to error with sessionExpired",
  (state, events) => {
    const actor = journey(events);
    expect(actor.getSnapshot().value).toBe(state);

    actor.send({ type: "SESSION_EXPIRED" });

    expect(actor.getSnapshot().value).toBe("error");
    expect(actor.getSnapshot().context.reason).toBe("sessionExpired");
  },
);

test("AC-01.6 RESTART from error returns to idle and resets context", () => {
  const actor = journey([
    ...toDocumentValidation,
    invalid,
    captured,
    invalid,
    captured,
    invalid,
  ]);
  expect(actor.getSnapshot().value).toBe("error");
  expect(actor.getSnapshot().context.reason).toBe("maxAttempts");

  actor.send({ type: "RESTART" });

  expect(actor.getSnapshot().value).toBe("idle");
  expect(actor.getSnapshot().context).toEqual(initialContext);
});

test("AC-01.8 an event with no transition is ignored", () => {
  const actor = journey([]);
  const before = actor.getSnapshot();

  actor.send({ type: "CHOOSE_PHONE" });

  expect(actor.getSnapshot().value).toBe(before.value);
  expect(actor.getSnapshot().context).toEqual(before.context);
});

test("AC-01.8 SESSION_EXPIRED is ignored once the journey is complete", () => {
  const actor = journey([...toProcessing, { type: "VERIFIED" }]);
  expect(actor.getSnapshot().value).toBe("complete");

  actor.send({ type: "SESSION_EXPIRED" });

  expect(actor.getSnapshot().value).toBe("complete");
  expect(actor.getSnapshot().context.reason).toBeNull();
});

test("AC-01.8 an event with no transition is ignored in error", () => {
  const actor = journey([
    { type: "START", device: "phone" },
    { type: "SESSION_EXPIRED" },
  ]);
  const before = actor.getSnapshot();

  actor.send({ type: "SUBMIT" });

  expect(actor.getSnapshot().value).toBe("error");
  expect(actor.getSnapshot().context).toEqual(before.context);
});
