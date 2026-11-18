"use client";

import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  info: "border-info bg-info-soft",
  success: "border-success bg-success-soft",
  warning: "border-warning bg-warning-soft",
  danger: "border-danger bg-danger-soft",
};

type Props = {
  tone: Tone;
  title: string;
  children?: ReactNode;
};

export function Alert({ tone, title, children }: Props) {
  return (
    <div
      role={tone === "warning" || tone === "danger" ? "alert" : "status"}
      className={`flex gap-3 rounded-md border-l-4 p-4 text-ink ${tones[tone]}`}
    >
      <ToneIcon tone={tone} />
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold">{title}</p>
        {children ? (
          <div className="text-base leading-6">{children}</div>
        ) : null}
      </div>
    </div>
  );
}

function ToneIcon({ tone }: { tone: Tone }) {
  const mark = tone === "success" ? "M3 8.2 6.2 11.5 13 4.5" : "M8 4.5 V9";
  return (
    <svg
      viewBox="0 0 16 16"
      className="mt-1 size-4 shrink-0"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d={mark} fill="none" stroke="currentColor" strokeWidth="1.5" />
      {tone === "success" ? null : (
        <circle cx="8" cy="11.5" r="0.8" fill="currentColor" />
      )}
    </svg>
  );
}
