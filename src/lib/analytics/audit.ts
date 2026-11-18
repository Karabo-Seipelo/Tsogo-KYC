import type { Actor, InspectionEvent, Snapshot } from "xstate";
import type { kycMachine } from "../../machines/kycMachine";
import {
  kycStates,
  type KycEvent,
  type KycState,
} from "../../machines/kycMachine.types";

type AuditEvent = KycEvent["type"];

export type AuditEntry = {
  at: string;
  from: KycState;
  to: KycState;
  event: AuditEvent;
  outcome?: string;
};

const auditEvents: readonly AuditEvent[] = [
  "START",
  "CHOOSE_PHONE",
  "CHOOSE_THIS_DEVICE",
  "PHONE_CONNECTED",
  "DOC_CAPTURED",
  "DOC_VALID",
  "DOC_INVALID",
  "UPLOAD_FAILED",
  "SELFIE_CAPTURED",
  "LIVENESS_PASSED",
  "MATCHED",
  "NO_MATCH",
  "SUBMIT",
  "VERIFIED",
  "REJECTED",
  "RETAKE",
  "SESSION_EXPIRED",
  "REFRESH_TOKEN",
  "RESTART",
];

// A subscriber snapshot has no event. @xstate.snapshot carries the event that
// caused the update. Source: https://stately.ai/docs/inspection
export function subscribeAudit(actor: Actor<typeof kycMachine>) {
  const audit: AuditEntry[] = [];
  let from = stateName(actor.getSnapshot());

  actor.system.inspect((inspection: InspectionEvent) => {
    if (
      inspection.type !== "@xstate.snapshot" ||
      inspection.actorRef !== actor
    ) {
      return;
    }
    const to = stateName(inspection.snapshot);
    const event = auditEvent(inspection.event.type);
    if (!from || !to || !event || from === to) {
      return;
    }
    audit.push({
      at: new Date().toISOString(),
      from,
      to,
      event,
    });
    from = to;
  });

  return audit;
}

function stateName(snapshot: Snapshot<unknown>): KycState | undefined {
  if (!("value" in snapshot) || typeof snapshot.value !== "string") {
    return undefined;
  }
  return kycStates.find((state) => state === snapshot.value);
}

function auditEvent(type: string): AuditEvent | undefined {
  return auditEvents.find((event) => event === type);
}
