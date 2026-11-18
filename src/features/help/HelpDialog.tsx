"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useContent } from "@/lib/content/useContent";

const HelpContext = createContext<(trigger: HTMLElement | null) => void>(
  () => undefined,
);

export function useOpenHelp() {
  return useContext(HelpContext);
}

type Props = {
  children: React.ReactNode;
};

export function HelpProvider({ children }: Props) {
  const { t } = useContent();
  const helpButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  function openHelp(trigger: HTMLElement | null) {
    opener.current = trigger;
    setOpen(true);
  }

  function close() {
    setOpen(false);
    opener.current?.focus();
  }

  return (
    <HelpContext.Provider value={openHelp}>
      <div className="min-h-dvh bg-white text-neutral-950">
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
          <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-6 py-4">
            <p className="text-sm font-semibold">{t("common.header.title")}</p>
            <button
              ref={helpButton}
              type="button"
              className="border border-neutral-950 px-3 py-2 text-sm"
              onClick={() => openHelp(helpButton.current)}
            >
              {t("common.header.help")}
            </button>
          </div>
        </header>
        {children}
      </div>
      {open ? <HelpPanel onClose={close} /> : null}
    </HelpContext.Provider>
  );
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  const { content, t } = useContent();
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
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-neutral-950/40 p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="flex w-full max-w-xl flex-col gap-4 border-2 border-neutral-950 bg-white p-6 text-neutral-950"
      >
        <h2
          id="help-title"
          ref={heading}
          tabIndex={-1}
          className="text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {t("help.title")}
        </h2>
        {content.help.faq.map((item) => (
          <section key={item.q} className="flex flex-col gap-1">
            <h3 className="text-base font-semibold">{item.q}</h3>
            <p className="text-base leading-6">{item.a}</p>
          </section>
        ))}
        <a className="w-fit text-sm underline" href="/privacy">
          {t("help.privacyLink")}
        </a>
        <p className="text-base leading-6">{t("help.support")}</p>
        <button
          type="button"
          className="w-fit border border-neutral-950 px-4 py-3"
          onClick={onClose}
        >
          {t("help.close")}
        </button>
      </div>
    </div>
  );
}
