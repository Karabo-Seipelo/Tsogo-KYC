"use client";

import { useEffect, useRef, useState } from "react";

export const statusPollMs = 2_500;

export type SessionStatus = {
  step: string;
  phoneConnected: boolean;
  lastSeen: string | null;
  handoffExpired: boolean;
  expired: boolean;
  expiresAt: string | null;
  ttl: 1 | null;
  outcome: string | null;
  reference: string | null;
  checks: ReviewCheck[];
  livenessPassed: boolean;
  match: boolean;
};

type ReviewCheck = {
  id: string;
  label: string;
  passed: boolean;
};

export function useStatusPoll() {
  const [status, setStatus] = useState<SessionStatus | null>(null);

  const hadSession = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.hidden) {
        return;
      }
      try {
        const response = await fetch("/api/session/status");
        if (cancelled) {
          return;
        }
        if (response.status === 401 && hadSession.current) {
          setStatus((current) =>
            current ? { ...current, expired: true } : current,
          );
          return;
        }
        if (!response.ok) {
          return;
        }
        const next = sessionStatusFrom(await response.json());
        if (next && !cancelled) {
          hadSession.current = true;
          setStatus(next);
        }
      } catch {
        return;
      }
    }

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, statusPollMs);

    function onVisibility() {
      if (!document.hidden) {
        void poll();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return status;
}

function sessionStatusFrom(body: unknown): SessionStatus | null {
  if (!isRecord(body) || typeof body.step !== "string") {
    return null;
  }
  return {
    step: body.step,
    phoneConnected: body.phoneConnected === true,
    lastSeen: typeof body.lastSeen === "string" ? body.lastSeen : null,
    handoffExpired: body.handoffExpired === true,
    expired: body.expired === true,
    expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : null,
    ttl: body.ttl === 1 ? 1 : null,
    outcome: typeof body.outcome === "string" ? body.outcome : null,
    reference: typeof body.reference === "string" ? body.reference : null,
    checks: reviewChecks(body.checks),
    livenessPassed: body.livenessPassed === true,
    match: body.match === true,
  };
}

function reviewChecks(value: unknown): ReviewCheck[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== "string") {
      return [];
    }
    return [
      {
        id: item.id,
        label: typeof item.label === "string" ? item.label : item.id,
        passed: item.passed === true,
      },
    ];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
