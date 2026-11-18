import { createActor } from "xstate";
import { expect, test } from "vitest";
import { kycMachine } from "../../machines/kycMachine";
import type { KycEvent } from "../../machines/kycMachine.types";
import { subscribeAudit } from "./audit";

const toComplete: KycEvent[] = [
  { type: "START", device: "desktop" },
  { type: "CHOOSE_THIS_DEVICE" },
  { type: "DOC_CAPTURED" },
  { type: "DOC_VALID" },
  { type: "SELFIE_CAPTURED" },
  { type: "LIVENESS_PASSED" },
  { type: "MATCHED" },
  { type: "SUBMIT" },
  { type: "VERIFIED" },
];

test("AC-08.2 a completed session lists every transition from idle to complete", () => {
  const audit = run(toComplete);

  expect(audit.map(({ from, to, event }) => ({ from, to, event }))).toEqual([
    { from: "idle", to: "deviceSelection", event: "START" },
    {
      from: "deviceSelection",
      to: "documentUpload",
      event: "CHOOSE_THIS_DEVICE",
    },
    {
      from: "documentUpload",
      to: "documentValidation",
      event: "DOC_CAPTURED",
    },
    { from: "documentValidation", to: "selfieCapture", event: "DOC_VALID" },
    { from: "selfieCapture", to: "livenessCheck", event: "SELFIE_CAPTURED" },
    { from: "livenessCheck", to: "faceMatch", event: "LIVENESS_PASSED" },
    { from: "faceMatch", to: "review", event: "MATCHED" },
    { from: "review", to: "processing", event: "SUBMIT" },
    { from: "processing", to: "complete", event: "VERIFIED" },
  ]);

  for (const entry of audit) {
    expect(Date.parse(entry.at)).not.toBeNaN();
  }
});

test("AC-08.2 an event with no transition is not audited", () => {
  expect(run([{ type: "CHOOSE_PHONE" }])).toEqual([]);
});

test("AC-08.2 the trail only grows", () => {
  const actor = createActor(kycMachine).start();
  const audit = subscribeAudit(actor);

  actor.send({ type: "START", device: "phone" });
  const first = structuredClone(audit[0]);

  actor.send({ type: "DOC_CAPTURED" });

  expect(audit[0]).toEqual(first);
  expect(audit.map(({ from, to, event }) => ({ from, to, event }))).toEqual([
    { from: "idle", to: "documentUpload", event: "START" },
    {
      from: "documentUpload",
      to: "documentValidation",
      event: "DOC_CAPTURED",
    },
  ]);
});

function run(events: KycEvent[]) {
  const actor = createActor(kycMachine).start();
  const audit = subscribeAudit(actor);
  for (const event of events) {
    actor.send(event);
  }
  return audit;
}
