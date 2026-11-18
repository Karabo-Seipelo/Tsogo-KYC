"use client";

import { useEffect, useState } from "react";
import { FaceMatch } from "./FaceMatch";
import { LivenessCheck } from "./LivenessCheck";
import { SelfieCapture } from "./SelfieCapture";

const blankPhoto =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

type Phase = "capture" | "liveness" | "comparing" | "matched";

type Props = {
  documentSrc?: string | null;
};

export function SelfieJourney({ documentSrc }: Props) {
  const [phase, setPhase] = useState<Phase>("capture");
  const [selfieSrc, setSelfieSrc] = useState(blankPhoto);

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
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [phase]);

  if (phase === "liveness") {
    return <LivenessCheck onPassed={() => setPhase("comparing")} />;
  }

  if (phase === "comparing" || phase === "matched") {
    return (
      <FaceMatch
        phase={phase}
        documentSrc={documentSrc || blankPhoto}
        selfieSrc={selfieSrc}
        onContinue={() => undefined}
      />
    );
  }

  return (
    <SelfieCapture
      onDone={(thumbnail) => {
        setSelfieSrc(URL.createObjectURL(thumbnail));
        setPhase("liveness");
      }}
    />
  );
}
