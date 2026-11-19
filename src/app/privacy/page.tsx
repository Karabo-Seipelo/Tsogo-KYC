"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import bundled from "../../../content/en-ZA.json";
import { HelpProvider } from "@/features/help/HelpDialog";
import { ContentProvider } from "@/lib/content/ContentProvider";
import { contentSchema } from "@/lib/content/schema";
import { Screen } from "@/components/ui/Screen";
import { focusRing, screenTitle } from "@/components/ui/styles";
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
  const title = t("common.documentTitle", {
    screen: t("privacy.title"),
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
        {t("privacy.title")}
      </h1>
      <p className="text-base leading-6">{t("privacy.demo")}</p>
      {content.privacy.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-2">
          <h2 className="text-heading font-semibold">{section.heading}</h2>
          <p className="text-base leading-6">{section.body}</p>
        </section>
      ))}
      <Link
        className={`w-fit text-sm text-gold-strong underline ${focusRing}`}
        href="/"
      >
        {t("privacy.back")}
      </Link>
    </Screen>
  );
}
