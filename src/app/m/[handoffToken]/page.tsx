"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import bundled from "../../../../content/en-ZA.json";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
import { HelpProvider } from "@/features/help/HelpDialog";
import { ContentProvider } from "@/lib/content/ContentProvider";
import { contentSchema } from "@/lib/content/schema";
import { useContent } from "@/lib/content/useContent";

type RedeemResult = "joined" | "used" | "failed";

const redeems = new Map<string, Promise<RedeemResult>>();

export default function Page() {
  const params = useParams();
  const token =
    typeof params.handoffToken === "string" ? params.handoffToken : null;
  const [result, setResult] = useState<RedeemResult | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    const existing = redeems.get(token);
    const redeeming = existing ?? redeemToken(token);
    if (!existing) {
      redeems.set(token, redeeming);
    }
    let active = true;
    void redeeming.then((outcome) => {
      if (active) {
        setResult(outcome);
      }
    });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (result === "joined") {
      window.location.replace("/m");
    }
  }, [result]);

  return (
    <ContentProvider content={contentSchema.parse(bundled)}>
      <HelpProvider>
        {result === "used" ? (
          <Notice
            titleKey="errors.HANDOFF_USED.title"
            bodyKey="errors.HANDOFF_USED.body"
          />
        ) : null}
        {result === "failed" ? (
          <Notice
            titleKey="errors.generic.title"
            bodyKey="errors.generic.body"
          />
        ) : null}
        {result === "joined" || result === null ? <main /> : null}
      </HelpProvider>
    </ContentProvider>
  );
}

function Notice({
  titleKey,
  bodyKey,
}: {
  titleKey: "errors.HANDOFF_USED.title" | "errors.generic.title";
  bodyKey: "errors.HANDOFF_USED.body" | "errors.generic.body";
}) {
  const { t } = useContent();
  const heading = useRef<HTMLHeadingElement>(null);
  const title = t("common.documentTitle", {
    screen: t(titleKey),
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
        {t(titleKey)}
      </h1>
      <p className="text-base leading-6">{t(bodyKey)}</p>
    </Screen>
  );
}

async function redeemToken(token: string): Promise<RedeemResult> {
  try {
    const response = await fetch(`/api/handoff/${encodeURIComponent(token)}`, {
      method: "POST",
      redirect: "manual",
    });
    if (joined(response)) {
      return "joined";
    }
    if (response.status === 410) {
      return "used";
    }
    return "failed";
  } catch {
    return "failed";
  }
}

function joined(response: Response) {
  return (
    response.status === 303 ||
    response.status === 0 ||
    response.type === "opaqueredirect"
  );
}
