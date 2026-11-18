"use client";

import { useEffect, useState } from "react";

export const statusPollMs = 2_500;

export type SessionStatus = {
  step: string;
  phoneConnected: boolean;
  lastSeen: string | null;
  handoffExpired: boolean;
  expired: boolean;
  expiresAt: string | null;
  ttl: 1 | null;
};

export function useStatusPoll() {
  const [status, setStatus] = useState<SessionStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.hidden) {
        return;
      }
      try {
        const response = await fetch("/api/session/status");
        if (!response.ok || cancelled) {
          return;
        }
        const next = sessionStatusFrom(await response.json());
        if (next && !cancelled) {
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
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
