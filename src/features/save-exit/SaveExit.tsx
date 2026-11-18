"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useContent } from "@/lib/content/useContent";

export const saveWindowMinutes = 15;

const SaveExitContext = createContext<
  ((trigger: HTMLElement | null) => void) | null
>(null);

type Props = {
  children: React.ReactNode;
};

export function SaveExitProvider({ children }: Props) {
  const opener = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  function openConfirm(trigger: HTMLElement | null) {
    opener.current = trigger;
    setOpen(true);
  }

  function keepGoing() {
    setOpen(false);
    opener.current?.focus();
  }

  function confirmExit() {
    setOpen(false);
    setSaved(true);
  }

  if (saved) {
    return <SavedPage />;
  }

  return (
    <SaveExitContext.Provider value={openConfirm}>
      {children}
      {open ? (
        <ConfirmDialog onKeepGoing={keepGoing} onConfirm={confirmExit} />
      ) : null}
    </SaveExitContext.Provider>
  );
}

export function SaveExitButton() {
  const openConfirm = useContext(SaveExitContext);
  const { t } = useContent();
  const button = useRef<HTMLButtonElement>(null);

  if (!openConfirm) {
    return null;
  }

  return (
    <button
      ref={button}
      type="button"
      className="border border-neutral-950 px-3 py-2 text-sm"
      onClick={() => openConfirm(button.current)}
    >
      {t("common.header.saveAndExit")}
    </button>
  );
}

function ConfirmDialog({
  onKeepGoing,
  onConfirm,
}: {
  onKeepGoing: () => void;
  onConfirm: () => void;
}) {
  const { t } = useContent();
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const onKeepGoingRef = useRef(onKeepGoing);

  useEffect(() => {
    onKeepGoingRef.current = onKeepGoing;
  }, [onKeepGoing]);

  useEffect(() => {
    heading.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onKeepGoingRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel.current) {
        return;
      }
      const items = [
        ...panel.current.querySelectorAll<HTMLElement>(
          "button:not([disabled])",
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
        aria-labelledby="save-exit-title"
        className="flex w-full max-w-xl flex-col gap-4 border-2 border-neutral-950 bg-white p-6 text-neutral-950"
      >
        <h2
          id="save-exit-title"
          ref={heading}
          tabIndex={-1}
          className="text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {t("saveExit.confirmTitle")}
        </h2>
        <p className="text-base leading-6">
          {t("saveExit.confirmBody", { minutes: saveWindowMinutes })}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="border border-neutral-950 px-4 py-3"
            onClick={onKeepGoing}
          >
            {t("saveExit.cancel")}
          </button>
          <button
            type="button"
            className="border border-neutral-950 bg-neutral-950 px-4 py-3 text-white"
            onClick={onConfirm}
          >
            {t("saveExit.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SavedPage() {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {t("saveExit.savedTitle")}
        </h1>
        <p className="text-base leading-6">
          {t("saveExit.savedBody", { minutes: saveWindowMinutes })}
        </p>
        <a className="w-fit text-sm underline" href="#">
          {t("saveExit.return")}
        </a>
      </div>
    </main>
  );
}
