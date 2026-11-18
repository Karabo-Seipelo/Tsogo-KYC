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
    <p
      role="status"
      className="border-b border-neutral-950 bg-white px-6 py-3 text-sm"
    >
      {t("errors.OFFLINE.banner")}
    </p>
  );
}
