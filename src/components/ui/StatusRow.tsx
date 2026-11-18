"use client";

import { useContent } from "@/lib/content/useContent";
import type { ContentKey } from "@/lib/content/t";
import { classes } from "./styles";

type Status = "done" | "inProgress" | "waiting";

const statusKey: Record<Status, ContentKey> = {
  done: "common.status.done",
  inProgress: "common.status.inProgress",
  waiting: "common.status.waiting",
};

type Props = {
  label: string;
  status: Status;
};

export function StatusRow({ label, status }: Props) {
  const { t } = useContent();

  return (
    <div className="flex items-center justify-between gap-4 text-base">
      <span className="flex items-center gap-3">
        <StatusIcon status={status} />
        <span
          className={classes(
            status === "inProgress" && "font-semibold",
            status === "waiting" && "text-ink-muted",
          )}
        >
          {label}
        </span>
      </span>
      <span>{t(statusKey[status])}</span>
    </div>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "done") {
    return (
      <svg viewBox="0 0 16 16" className="size-4 text-ink" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path
          d="M4.2 8.2 6.7 10.7 11.8 5.5"
          fill="none"
          className="text-on-ink"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className="size-4 text-ink" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={status === "waiting" ? "text-ink-muted" : undefined}
      />
      {status === "inProgress" ? (
        <circle cx="8" cy="8" r="2.5" fill="currentColor" />
      ) : null}
    </svg>
  );
}
