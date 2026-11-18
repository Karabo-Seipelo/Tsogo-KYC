"use client";

import type { ButtonHTMLAttributes } from "react";
import { classes, focusRing, stateMotion } from "./styles";

type Variant = "primary" | "secondary" | "text";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-on-ink",
  secondary: "border border-line-strong bg-surface text-ink",
  text: "text-gold-strong",
};

type Props = {
  variant?: Variant;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={classes(
        "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-base",
        variants[variant],
        "enabled:hover:opacity-[92%] enabled:active:opacity-[84%]",
        "disabled:bg-line disabled:text-ink-muted disabled:opacity-100",
        focusRing,
        stateMotion,
        className,
      )}
      {...props}
    >
      {loading ? "…" : children}
    </button>
  );
}
