"use client";

import { createContext, useContext, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { focusRing } from "@/components/ui/styles";
import { useSaveExit } from "@/features/save-exit/SaveExit";
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
  const opener = useRef<HTMLElement | null>(null);
  const openSave = useSaveExit();
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
      <div className="min-h-dvh bg-canvas text-ink">
        <Header
          onHelp={() => {
            openHelp(
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null,
            );
          }}
          onSaveExit={
            openSave
              ? () => {
                  openSave(
                    document.activeElement instanceof HTMLElement
                      ? document.activeElement
                      : null,
                  );
                }
              : undefined
          }
        />
        {children}
      </div>
      {open ? <HelpPanel onClose={close} /> : null}
    </HelpContext.Provider>
  );
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  const { content, t } = useContent();

  return (
    <Dialog
      title={t("help.title")}
      labelledBy="help-title"
      onClose={onClose}
      actions={
        <Button variant="secondary" onClick={onClose}>
          {t("help.close")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {content.help.faq.map((item) => (
          <section key={item.q} className="flex flex-col gap-1">
            <h3 className="text-base font-semibold">{item.q}</h3>
            <p className="text-base leading-6">{item.a}</p>
          </section>
        ))}
        <a
          className={`w-fit text-sm text-gold-strong underline ${focusRing}`}
          href="/privacy"
        >
          {t("help.privacyLink")}
        </a>
        <p className="text-base leading-6">{t("help.support")}</p>
      </div>
    </Dialog>
  );
}
