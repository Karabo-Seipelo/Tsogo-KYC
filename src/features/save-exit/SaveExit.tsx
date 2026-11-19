"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Screen } from "@/components/ui/Screen";
import { focusRing, screenTitle } from "@/components/ui/styles";
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

export function useSaveExit() {
  return useContext(SaveExitContext);
}

export function SaveExitButton() {
  const openConfirm = useContext(SaveExitContext);
  const { t } = useContent();

  if (!openConfirm) {
    return null;
  }

  return (
    <Button
      variant="text"
      onClick={(event) => openConfirm(event.currentTarget)}
    >
      {t("common.header.saveAndExit")}
    </Button>
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

  return (
    <Dialog
      title={t("saveExit.confirmTitle")}
      labelledBy="save-exit-title"
      onClose={onKeepGoing}
      actions={
        <>
          <Button variant="secondary" onClick={onKeepGoing}>
            {t("saveExit.cancel")}
          </Button>
          <Button onClick={onConfirm}>{t("saveExit.confirm")}</Button>
        </>
      }
    >
      {t("saveExit.confirmBody", { minutes: saveWindowMinutes })}
    </Dialog>
  );
}

function SavedPage() {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const title = t("common.documentTitle", {
    screen: t("saveExit.savedTitle"),
    site: t("common.header.title"),
  });

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Screen>
      <h1 ref={heading} tabIndex={-1} className={screenTitle}>
        {t("saveExit.savedTitle")}
      </h1>
      <p className="text-base leading-6">
        {t("saveExit.savedBody", { minutes: saveWindowMinutes })}
      </p>
      <a
        className={`w-fit text-sm text-gold-strong underline ${focusRing}`}
        href="#"
      >
        {t("saveExit.return")}
      </a>
    </Screen>
  );
}
