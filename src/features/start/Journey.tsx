"use client";

import { useEffect, useState } from "react";
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
        <JourneyFlow device={device} />
      </HelpProvider>
    </SaveExitProvider>
  );
}

function JourneyFlow({ device }: { device: Device }) {
  const { state, send } = useKycMachine();
  usePhoneHeartbeat(device, state);
  const [documentPhoto, setDocumentPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentKind | null>(null);
  const [checks, setChecks] = useState<ReviewCheck[]>([]);
  const [handoff, setHandoff] = useState<HandoffCode | null>(null);

  if (state === "deviceSelection") {
    return (
      <DeviceSelection
        onChooseThisDevice={() => send({ type: "CHOOSE_THIS_DEVICE" })}
        onChoosePhone={() => send({ type: "CHOOSE_PHONE" })}
      />
    );
  }

  if (state === "qrHandoff" && handoff) {
    return (
      <HandoffScreen
        token={handoff.token}
        expiresAt={handoff.expiresAt}
        host={window.location.host}
        onContinueHere={() => send({ type: "CHOOSE_THIS_DEVICE" })}
        onIssued={setHandoff}
        onReview={() => send({ type: "HANDBACK" })}
      />
    );
  }

  if (state === "documentUpload" || state === "documentValidation") {
    return (
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
  }

  if (
    state === "selfieCapture" ||
    state === "livenessCheck" ||
    state === "faceMatch"
  ) {
    return (
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
  }

  if (state === "review" && device === "phone") {
    return <PhoneDone />;
  }

  if (state === "review") {
    return (
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
  }

  if (state === "processing") {
    return <ProcessingScreen onComplete={() => send({ type: "VERIFIED" })} />;
  }

  if (state === "complete") {
    return <CompleteScreen />;
  }

  if (state === "idle") {
    return (
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
  }

  return <main />;
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
