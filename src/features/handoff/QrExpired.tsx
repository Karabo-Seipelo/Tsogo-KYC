"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";
import { QrHandoff } from "./QrHandoff";
import { useStatusPoll } from "./useStatusPoll";
import { StatusScreen } from "@/features/review/StatusScreen";

export const handoffWindowMinutes = 10;

export type HandoffCode = {
  token: string;
  expiresAt: string;
};

type ScreenProps = {
  token: string;
  expiresAt: string;
  host: string;
  onContinueHere: () => void;
  onIssued: (code: HandoffCode) => void;
  onReview: () => void;
};

export function HandoffScreen({
  token,
  expiresAt,
  host,
  onContinueHere,
  onIssued,
  onReview,
}: ScreenProps) {
  const [override, setOverride] = useState<HandoffCode | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [sawPhone, setSawPhone] = useState(false);
  const [qrAgain, setQrAgain] = useState(false);
  const status = useStatusPoll();
  const code = override ?? { token, expiresAt };
  const remaining = Date.parse(code.expiresAt) - now;
  const expired = Number.isNaN(remaining) || remaining <= 0;
  const connected = status?.phoneConnected === true;

  if (connected && !sawPhone) {
    setSawPhone(true);
  }
  if (connected && qrAgain) {
    setQrAgain(false);
  }

  useEffect(() => {
    if (status?.step === "review") {
      onReview();
    }
  }, [status?.step, onReview]);

  useEffect(() => {
    const wait = Date.parse(code.expiresAt) - Date.now();
    if (Number.isNaN(wait) || wait <= 0) {
      return;
    }
    const id = window.setTimeout(() => setNow(Date.now()), wait);
    return () => window.clearTimeout(id);
  }, [code.expiresAt]);

  if (expired && !sawPhone) {
    return (
      <QrExpired
        onContinueHere={onContinueHere}
        onIssued={(issued) => {
          setOverride(issued);
          onIssued(issued);
        }}
      />
    );
  }

  if (sawPhone && !qrAgain) {
    return (
      <StatusScreen
        step={status?.step ?? "qrHandoff"}
        phoneConnected={connected}
        outcome={status?.outcome}
        reference={status?.reference}
        onShowQr={() => setQrAgain(true)}
        onReview={onReview}
      />
    );
  }

  return (
    <QrHandoff
      token={code.token}
      host={host}
      onContinueHere={onContinueHere}
      phoneConnected={connected}
    />
  );
}

type ExpiredProps = {
  onContinueHere: () => void;
  onIssued: (code: HandoffCode) => void;
};

export function QrExpired({ onContinueHere, onIssued }: ExpiredProps) {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  async function refresh() {
    setPending(true);
    try {
      const response = await fetch("/api/session/handoff", { method: "POST" });
      if (!response.ok) {
        return;
      }
      const issued = handoffCodeFrom(await response.json());
      if (issued) {
        onIssued(issued);
      }
    } catch {
      return;
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen
      width="wide"
      action={
        <div className="flex flex-col gap-3 md:flex-row">
          <Button
            className="w-full md:w-fit"
            disabled={pending}
            onClick={() => {
              void refresh();
            }}
          >
            {t("handoff.expired.cta")}
          </Button>
          <Button
            variant="secondary"
            className="w-full md:w-fit"
            onClick={onContinueHere}
          >
            {t("handoff.expired.fallback")}
          </Button>
        </div>
      }
    >
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("handoff.expired.title")}
      </h1>
      <Alert
        tone="warning"
        title={t("handoff.expired.body", { minutes: handoffWindowMinutes })}
      />
    </Screen>
  );
}

export function handoffCodeFrom(body: unknown): HandoffCode | null {
  if (!isRecord(body)) {
    return null;
  }
  const token = body.handoffToken;
  const expiresAt = body.handoffExpiresAt;
  if (typeof token !== "string" || typeof expiresAt !== "string") {
    return null;
  }
  return { token, expiresAt };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
