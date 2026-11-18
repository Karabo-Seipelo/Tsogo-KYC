"use client";

import { useContent } from "@/lib/content/useContent";
import { classes, focusRing, stateMotion } from "@/components/ui/styles";

type Props = {
  onHelp: () => void;
  onSaveExit?: () => void;
};

const textButton = classes(
  "inline-flex min-h-11 items-center px-3 text-sm text-gold-strong",
  focusRing,
  stateMotion,
);

export function Header({ onHelp, onSaveExit }: Props) {
  const { t } = useContent();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span aria-hidden="true" className="size-2 rounded-full bg-gold" />
          <span className="md:hidden">{t("common.header.titleShort")}</span>
          <span className="hidden md:inline">{t("common.header.title")}</span>
        </p>
        <div className="flex items-center gap-2">
          {onSaveExit ? (
            <button
              type="button"
              className={classes(
                "hidden min-h-11 items-center px-3 text-sm text-gold-strong md:inline-flex",
                focusRing,
                stateMotion,
              )}
              onClick={onSaveExit}
            >
              {t("common.header.saveAndExit")}
            </button>
          ) : null}
          <button type="button" className={textButton} onClick={onHelp}>
            {t("common.header.help")}
          </button>
        </div>
      </div>
    </header>
  );
}
