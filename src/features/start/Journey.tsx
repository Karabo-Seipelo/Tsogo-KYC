"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { DocumentKind } from "@/features/capture/DocumentType";
import { DocumentJourney } from "@/features/capture/DocumentJourney";
import { SelfieJourney } from "@/features/capture/SelfieJourney";
import { CompleteScreen } from "@/features/review/CompleteScreen";
import { ProcessingScreen } from "@/features/review/ProcessingScreen";
import { ReviewScreen, type ReviewCheck } from "@/features/review/ReviewScreen";
import { HelpProvider } from "@/features/help/HelpDialog";
import { SaveExitProvider } from "@/features/save-exit/SaveExit";
import type { Device } from "@/machines/kycMachine.types";
import { useKycMachine } from "@/machines/useKycMachine";
import {
  HandoffScreen,
  handoffCodeFrom,
  type HandoffCode,
} from "@/features/handoff/QrExpired";
import { PhoneDone } from "@/features/review/PhoneDone";
import { OfflineBanner } from "@/features/resilience/OfflineBanner";
import { SessionExpired } from "@/features/resilience/SessionExpired";
import {
  TimeoutWarning,
  shouldWarn,
} from "@/features/resilience/TimeoutWarning";
import { useStatusPoll } from "@/features/handoff/useStatusPoll";
import { DeviceSelection } from "./DeviceSelection";
import { StartScreen } from "./StartScreen";

const blankPhoto =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

type Props = {
  device?: Device;
};

export function Journey({ device = "desktop" }: Props) {
  return (
    <SaveExitProvider>
      <HelpProvider>
        {device === "phone" ? <OfflineBanner /> : null}
        <JourneyFlow device={device} />
      </HelpProvider>
    </SaveExitProvider>
  );
}

function JourneyFlow({ device }: { device: Device }) {
  const { state, send, reason } = useKycMachine();
  usePhoneHeartbeat(device, state);
  const status = useStatusPoll();
  const [now, setNow] = useState(() => Date.now());
  const [heldExpiresAt, setHeldExpiresAt] = useState<string | null>(null);
  const [documentPhoto, setDocumentPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentKind | null>(null);
  const [checks, setChecks] = useState<ReviewCheck[]>([]);
  const [handoff, setHandoff] = useState<HandoffCode | null>(null);
  const deadline = laterDeadline(status?.expiresAt ?? null, heldExpiresAt);
  const remaining =
    deadline === null ? Number.POSITIVE_INFINITY : deadline - now;
  const heldRemaining =
    heldExpiresAt === null ? 0 : Date.parse(heldExpiresAt) - now;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!status?.expired || heldRemaining > 0) {
      return;
    }
    if (state === "idle" || state === "complete" || state === "error") {
      return;
    }
    send({ type: "SESSION_EXPIRED" });
  }, [heldRemaining, send, state, status?.expired]);

  function restart() {
    void refreshSession().finally(() => {
      setDocumentPhoto((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      setSelfiePhoto((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      setChecks([]);
      setDocumentType(null);
      setHandoff(null);
      setHeldExpiresAt(null);
      send({ type: "RESTART" });
    });
  }

  if (state === "error" && reason === "sessionExpired") {
    return (
      <SessionExpired
        minutes={status?.ttl === 1 ? 1 : 15}
        onRestart={restart}
      />
    );
  }

  let screen: ReactNode;
  if (state === "deviceSelection") {
    screen = (
      <DeviceSelection
        onChooseThisDevice={() => send({ type: "CHOOSE_THIS_DEVICE" })}
        onChoosePhone={() => send({ type: "CHOOSE_PHONE" })}
      />
    );
  } else if (state === "qrHandoff" && handoff) {
    screen = (
      <HandoffScreen
        token={handoff.token}
        expiresAt={handoff.expiresAt}
        host={window.location.host}
        onContinueHere={() => send({ type: "CHOOSE_THIS_DEVICE" })}
        onIssued={setHandoff}
        onReview={() => send({ type: "HANDBACK" })}
      />
    );
  } else if (state === "documentUpload" || state === "documentValidation") {
    screen = (
      <DocumentJourney
        send={send}
        onThumbnail={(thumbnail) => {
          setDocumentPhoto((current) => {
            if (current) {
              URL.revokeObjectURL(current);
            }
            return URL.createObjectURL(thumbnail);
          });
        }}
        onDocumentType={setDocumentType}
        onChecks={setChecks}
      />
    );
  } else if (
    state === "selfieCapture" ||
    state === "livenessCheck" ||
    state === "faceMatch"
  ) {
    screen = (
      <SelfieJourney
        documentSrc={documentPhoto}
        send={send}
        onSelfie={(src) => {
          setSelfiePhoto((current) => {
            if (current && current !== src) {
              URL.revokeObjectURL(current);
            }
            return src;
          });
        }}
      />
    );
  } else if (state === "review" && device === "phone") {
    screen = <PhoneDone />;
  } else if (state === "review") {
    screen = (
      <ReviewScreen
        documentType={documentType ?? "passport"}
        documentSrc={documentPhoto ?? blankPhoto}
        selfieSrc={selfiePhoto ?? blankPhoto}
        checks={checks}
        livenessPassed
        matched
        onRetake={(target) => send({ type: "RETAKE", target })}
        onSubmit={() => {
          void submitReview(send);
        }}
      />
    );
  } else if (state === "processing") {
    screen = <ProcessingScreen onComplete={() => send({ type: "VERIFIED" })} />;
  } else if (state === "complete") {
    screen = <CompleteScreen />;
  } else if (state === "idle") {
    screen = (
      <StartScreen
        onStart={() => {
          if (device === "phone") {
            send({ type: "START", device: "phone" });
            return;
          }
          void startDesktopSession(setHandoff).finally(() => {
            send({ type: "START", device: "desktop" });
          });
        }}
      />
    );
  } else {
    screen = <main />;
  }

  return (
    <>
      {screen}
      {shouldWarn(remaining, status?.ttl ?? null) ? (
        <TimeoutWarning
          remainingMs={remaining}
          onStay={() => {
            void staySession().then((expiresAt) => {
              if (expiresAt) {
                setHeldExpiresAt(expiresAt);
              }
            });
          }}
          onEnd={() => {
            setHeldExpiresAt(null);
            void endSession();
            send({ type: "SESSION_EXPIRED" });
          }}
        />
      ) : null}
    </>
  );
}

const phoneHeartbeatMs = 10_000;

function usePhoneHeartbeat(device: Device, step: string) {
  useEffect(() => {
    if (device !== "phone" || step === "idle") {
      return;
    }
    void sendHeartbeat(step);
    const timer = window.setInterval(() => {
      void sendHeartbeat(step);
    }, phoneHeartbeatMs);
    return () => window.clearInterval(timer);
  }, [device, step]);
}

async function sendHeartbeat(step: string) {
  try {
    await fetch("/api/session/heartbeat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ step }),
    });
  } catch {
    return;
  }
}

function switchQuery() {
  const page = new URLSearchParams(window.location.search);
  const switches = new URLSearchParams();
  const fail = page.get("fail");
  const ttl = page.get("ttl");
  if (fail) {
    switches.set("fail", fail);
  }
  if (ttl) {
    switches.set("ttl", ttl);
  }
  const query = switches.toString();
  return query ? `?${query}` : "";
}

async function startDesktopSession(setHandoff: (code: HandoffCode) => void) {
  try {
    const response = await fetch(`/api/session${switchQuery()}`, {
      method: "POST",
    });
    if (!response.ok) {
      return;
    }
    const code = handoffCodeFrom(await response.json());
    if (code) {
      setHandoff(code);
    }
  } catch {
    return;
  }
}

async function refreshSession() {
  try {
    await fetch(`/api/session${switchQuery()}`, { method: "POST" });
  } catch {
    return;
  }
}

async function staySession() {
  try {
    const response = await fetch("/api/session/stay", { method: "POST" });
    if (!response.ok) {
      return null;
    }
    const body: unknown = await response.json();
    if (isRecord(body) && typeof body.expiresAt === "string") {
      return body.expiresAt;
    }
  } catch {
    return null;
  }
  return null;
}

async function endSession() {
  try {
    await fetch("/api/session/stay", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ end: true }),
    });
  } catch {
    return;
  }
}

function laterDeadline(server: string | null, held: string | null) {
  const times = [server, held]
    .map((value) => (value === null ? Number.NaN : Date.parse(value)))
    .filter((value) => !Number.isNaN(value));
  if (times.length === 0) {
    return null;
  }
  return Math.max(...times);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function submitReview(send: (event: { type: "SUBMIT" }) => void) {
  try {
    const response = await fetch("/api/session/submit", { method: "POST" });
    if (!response.ok) {
      return;
    }
    send({ type: "SUBMIT" });
  } catch {
    return;
  }
}
