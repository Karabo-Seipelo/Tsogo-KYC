"use client";

import type { ReactNode } from "react";
import { classes } from "./styles";

type Props = {
  children: ReactNode;
  action?: ReactNode;
  width?: "task" | "wide";
  align?: "start" | "center";
};

export function Screen({
  children,
  action,
  width = "task",
  align = "start",
}: Props) {
  return (
    <main className="bg-canvas text-ink md:px-6 md:py-10">
      <div
        className={classes(
          "mx-auto flex min-h-dvh w-full flex-col md:min-h-0 md:rounded-lg md:bg-surface md:shadow-card",
          width === "wide" ? "md:max-w-[720px]" : "md:max-w-[560px]",
        )}
      >
        <div
          className={classes(
            "flex flex-1 flex-col gap-6 px-4 py-6 md:p-8",
            align === "center" && "items-center text-center",
          )}
        >
          {children}
        </div>
        {action ? (
          <div className="sticky bottom-0 border-t border-line bg-surface px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:rounded-b-lg md:border-0 md:px-8 md:pt-0 md:pb-8">
            {action}
          </div>
        ) : null}
      </div>
    </main>
  );
}
