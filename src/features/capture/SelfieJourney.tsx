"use client";

import { useEffect, useRef, useState } from "react";
import { FaceMatch } from "./FaceMatch";
import { LivenessCheck } from "./LivenessCheck";
import { SelfieCapture } from "./SelfieCapture";

const blankPhoto =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

type Phase = "capture" | "liveness" | "comparing" | "matched";

type SelfieEvent =
  | { type: "SELFIE_CAPTURED" }
  | { type: "LIVENESS_PASSED" }
  | { type: "MATCHED" }
  | { type: "NO_MATCH" };

type Props = {
  documentSrc?: string | null;
  send: (event: SelfieEvent) => void;
  onSelfie?: (src: string) => void;
};

export function SelfieJourney({ documentSrc, send, onSelfie }: Props) {
  const [phase, setPhase] = useState<Phase>("capture");
  const [selfieSrc, setSelfieSrc] = useState(blankPhoto);
  const sendRef = useRef(send);

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    if (phase !== "comparing") {
      return;
    }
    let cancelled = false;
    void fetch("/api/session/face-match", { method: "POST" })
      .then(async (response) => {
        if (!response.ok || cancelled) {
          return;
        }
        const body = (await response.json()) as { match?: boolean };
        if (body.match) {
          setPhase("matched");
          return;
        }
        sendRef.current({ type: "NO_MATCH" });
        setPhase("capture");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [phase]);

  async function finishLiveness() {
    try {
      const response = await fetch("/api/session/liveness", { method: "POST" });
      if (!response.ok) {
        return;
      }
      send({ type: "LIVENESS_PASSED" });
      setPhase("comparing");
    } catch {
      return;
    }
  }

  if (phase === "liveness") {
    return (
      <LivenessCheck
        onPassed={() => {
          void finishLiveness();
        }}
      />
    );
  }

  if (phase === "comparing" || phase === "matched") {
    return (
      <FaceMatch
        phase={phase}
        documentSrc={documentSrc || blankPhoto}
        selfieSrc={selfieSrc}
        onContinue={() => send({ type: "MATCHED" })}
      />
    );
  }

  return (
    <SelfieCapture
      onDone={(thumbnail) => {
        const src = URL.createObjectURL(thumbnail);
        setSelfieSrc(src);
        onSelfie?.(src);
        send({ type: "SELFIE_CAPTURED" });
        setPhase("liveness");
      }}
    />
  );
}
