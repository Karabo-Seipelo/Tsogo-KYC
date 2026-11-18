"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { OptionCard } from "@/components/ui/OptionCard";
import { Screen } from "@/components/ui/Screen";
import { screenTitle } from "@/components/ui/styles";
import { useContent } from "@/lib/content/useContent";

type Choice = "phone" | "thisDevice";

type Props = {
  onChooseThisDevice: () => void;
  onChoosePhone?: () => void;
};

export function DeviceSelection({ onChooseThisDevice, onChoosePhone }: Props) {
  const { t } = useContent();
  const phone = useRef<HTMLInputElement>(null);
  const [choice, setChoice] = useState<Choice>("phone");

  useEffect(() => {
    phone.current?.focus();
  }, []);

  return (
    <Screen
      action={
        <Button
          className="w-full"
          onClick={() => {
            if (choice === "thisDevice") {
              onChooseThisDevice();
            }
            if (choice === "phone") {
              onChoosePhone?.();
            }
          }}
        >
          {t("common.actions.continue")}
        </Button>
      }
    >
      <span aria-hidden="true" className="h-1 w-12 bg-gold" />
      <h1 id="device-title" className={screenTitle}>
        {t("device.title")}
      </h1>
      <p className="text-base leading-6">{t("device.intro")}</p>
      <div
        role="radiogroup"
        aria-labelledby="device-title"
        className="flex flex-col gap-3"
      >
        <OptionCard
          inputRef={phone}
          name="device"
          value="phone"
          checked={choice === "phone"}
          onChange={() => setChoice("phone")}
          title={t("device.options.phone.title")}
          description={t("device.options.phone.description")}
        />
        <OptionCard
          name="device"
          value="thisDevice"
          checked={choice === "thisDevice"}
          onChange={() => setChoice("thisDevice")}
          title={t("device.options.thisDevice.title")}
          description={t("device.options.thisDevice.description")}
        />
      </div>
    </Screen>
  );
}
