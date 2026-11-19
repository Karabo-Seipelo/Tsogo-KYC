"use client";

import { useEffect, useRef, useState } from "react";
import { FaceMatch } from "./FaceMatch";
import { LivenessCheck } from "./LivenessCheck";
import { SelfieCapture } from "./SelfieCapture";
import { useCamera } from "./useCamera";

const blankPhoto =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

type Phase = "capture" | "liveness" | "comparing" | "matched" | "noMatch";

type SelfieEvent =
  | { type: "SELFIE_CAPTURED" }
  | { type: "LIVENESS_PASSED" }
  | { type: "MATCHED" }
  | { type: "NO_MATCH" }
  | { type: "RETAKE"; target: "document" }
  | { type: "SESSION_EXPIRED" };

type Props = {
  documentSrc?: string | null;
  send: (event: SelfieEvent) => void;
  onSelfie?: (src: string) => void;
};

export function SelfieJourney({ documentSrc, send, onSelfie }: Props) {
  const [phase, setPhase] = useState<Phase>("capture");
  const [selfieSrc, setSelfieSrc] = useState(blankPhoto);
  const [attempt, setAttempt] = useState(1);
  const failures = useRef(0);
  const sendRef = useRef(send);
  const camera = useCamera();
  const cameraStarted = useRef(false);

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    if (cameraStarted.current) {
      return;
    }
    cameraStarted.current = true;
    void camera.start("user");
  });

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
        failures.current += 1;
        setAttempt(failures.current);
        sendRef.current({ type: "NO_MATCH" });
        setPhase("noMatch");
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
        stream={camera.stream}
        onPassed={() => {
          void finishLiveness();
        }}
      />
    );
  }

  if (phase === "comparing" || phase === "matched" || phase === "noMatch") {
    return (
      <FaceMatch
        phase={phase}
        documentSrc={documentSrc || blankPhoto}
        selfieSrc={selfieSrc}
        attempt={attempt}
        onContinue={() => send({ type: "MATCHED" })}
        onRetake={() => setPhase("capture")}
        onDifferentDocument={() => send({ type: "RETAKE", target: "document" })}
      />
    );
  }

  return (
    <SelfieCapture
      camera={camera}
      onExpired={() => send({ type: "SESSION_EXPIRED" })}
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
