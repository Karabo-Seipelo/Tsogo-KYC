"use client";

import { useContent } from "@/lib/content/useContent";
import { classes } from "./styles";

type Props = {
  current: number;
  total: number;
  name: string;
};

export function Progress({ current, total, name }: Props) {
  const { t } = useContent();
  const segments = Array.from({ length: total }, (_, index) => index < current);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {t("common.progress.label", { current, total, name })}
      </p>
      <div className="flex gap-2" aria-hidden="true">
        {segments.map((filled, index) => (
          <span
            key={index}
            className={classes(
              "h-1 flex-1 rounded-full",
              filled ? "bg-gold-strong" : "bg-line",
            )}
          />
        ))}
      </div>
    </div>
  );
}
