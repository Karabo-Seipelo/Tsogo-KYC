"use client";

import { useContent } from "@/lib/content/useContent";

export function DemoBanner() {
  const { t } = useContent();

  return (
    <p className="bg-ink px-4 py-2 text-center text-sm text-gold-bright">
      <span className="hidden md:inline">{t("common.demoBanner.long")}</span>
      <span className="md:hidden">{t("common.demoBanner.short")}</span>
    </p>
  );
}
