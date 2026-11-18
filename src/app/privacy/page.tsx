"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import bundled from "../../../content/en-ZA.json";
import { HelpProvider } from "@/features/help/HelpDialog";
import { ContentProvider } from "@/lib/content/ContentProvider";
import { contentSchema } from "@/lib/content/schema";
import { useContent } from "@/lib/content/useContent";

export default function Page() {
  return (
    <ContentProvider content={contentSchema.parse(bundled)}>
      <HelpProvider>
        <PrivacyNotice />
      </HelpProvider>
    </ContentProvider>
  );
}

function PrivacyNotice() {
  const { content, t } = useContent();
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
          {t("privacy.title")}
        </h1>
        <p className="text-base leading-6">{t("privacy.demo")}</p>
        {content.privacy.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">{section.heading}</h2>
            <p className="text-base leading-6">{section.body}</p>
          </section>
        ))}
        <Link className="w-fit text-sm underline" href="/">
          {t("privacy.back")}
        </Link>
      </div>
    </main>
  );
}
