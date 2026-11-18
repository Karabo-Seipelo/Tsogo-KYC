"use client";

import { useContent } from "@/lib/content/useContent";
import { useOnlineStatus } from "./useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const { t } = useContent();

  if (online) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 bg-warning-soft px-4 py-3 text-sm text-ink">
      <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
        <circle
          cx="8"
          cy="8"
          r="6.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 4.5 V9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="8" cy="11.5" r="0.8" fill="currentColor" />
      </svg>
      <p role="status">{t("errors.OFFLINE.banner")}</p>
    </div>
  );
}
