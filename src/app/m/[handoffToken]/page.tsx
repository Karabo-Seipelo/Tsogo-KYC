"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import bundled from "../../../../content/en-ZA.json";
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
          {t(titleKey)}
        </h1>
        <p className="text-base leading-6">{t(bodyKey)}</p>
      </div>
    </main>
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
