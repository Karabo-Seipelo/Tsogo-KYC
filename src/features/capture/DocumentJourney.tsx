"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/useContent";
import { DocumentCapture } from "./DocumentCapture";
import { DocumentPassed } from "./DocumentPassed";
import { DocumentType, type DocumentChoice } from "./DocumentType";

type Phase = "type" | "capture" | "checking" | "passed";

export function DocumentJourney() {
  const { content } = useContent();
  const [choice, setChoice] = useState<DocumentChoice | null>(null);
  const [phase, setPhase] = useState<Phase>("type");
  const [side, setSide] = useState(1);

  if (!choice || phase === "type") {
    return (
      <DocumentType
        onChoose={setChoice}
        onContinue={(next) => {
          setChoice(next);
          setSide(1);
          setPhase("capture");
        }}
      />
    );
  }

  if (phase === "passed") {
    return (
      <DocumentPassed
        checks={[
          {
            id: "corners",
            label: content.document.result.passed.checks.corners,
            passed: true,
          },
          {
            id: "readable",
            label: content.document.result.passed.checks.readable,
            passed: true,
          },
          {
            id: "notExpired",
            label: content.document.result.passed.checks.notExpired,
            passed: true,
          },
        ]}
        onContinue={() => undefined}
        onRetake={() => {
          setSide(1);
          setPhase("capture");
        }}
      />
    );
  }

  return (
    <DocumentCapture
      side={side}
      total={choice.sides}
      checking={phase === "checking"}
      onCapture={() => {
        if (side < choice.sides) {
          setSide(side + 1);
          return;
        }
        setPhase("checking");
        window.setTimeout(() => setPhase("passed"), 600);
      }}
    />
  );
}
