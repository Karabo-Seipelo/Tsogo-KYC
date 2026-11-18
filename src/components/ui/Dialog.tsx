"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { focusRing, panelMotion } from "./styles";

type Props = {
  title: string;
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
};

export function Dialog({
  title,
  labelledBy,
  onClose,
  children,
  actions,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    heading.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel.current) {
        return;
      }
      const items = [
        ...panel.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ),
      ];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === heading.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/48 p-4 sm:items-center">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`w-full max-w-xl rounded-lg bg-surface p-6 text-ink shadow-dialog ${panelMotion}`}
      >
        <h2
          id={labelledBy}
          ref={heading}
          tabIndex={-1}
          className={`text-heading font-semibold ${focusRing}`}
        >
          {title}
        </h2>
        <div className="mt-4 text-base leading-6">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div>
      </div>
    </div>
  );
}
