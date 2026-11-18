"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { useContent } from "@/lib/content/useContent";

type Choice = "phone" | "thisDevice";

type Props = {
  onChooseThisDevice: () => void;
};

export function DeviceSelection({ onChooseThisDevice }: Props) {
  const { t } = useContent();
  const phone = useRef<HTMLInputElement>(null);
  const [choice, setChoice] = useState<Choice>("phone");

  useEffect(() => {
    phone.current?.focus();
  }, []);

  return (
    <main className="min-h-dvh bg-white text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <h1 id="device-title" className="text-3xl font-semibold tracking-tight">
          {t("device.title")}
        </h1>
        <p className="text-base leading-6">{t("device.intro")}</p>
        <div
          role="radiogroup"
          aria-labelledby="device-title"
          className="flex flex-col gap-3"
        >
          <Option
            inputRef={phone}
            name="phone"
            checked={choice === "phone"}
            onSelect={() => setChoice("phone")}
            title={t("device.options.phone.title")}
            description={t("device.options.phone.description")}
          />
          <Option
            name="thisDevice"
            checked={choice === "thisDevice"}
            onSelect={() => setChoice("thisDevice")}
            title={t("device.options.thisDevice.title")}
            description={t("device.options.thisDevice.description")}
          />
        </div>
        <button
          type="button"
          className="w-full bg-neutral-950 px-4 py-3 text-white sm:w-fit"
          onClick={() => {
            if (choice === "thisDevice") {
              onChooseThisDevice();
            }
          }}
        >
          {t("common.actions.continue")}
        </button>
      </div>
    </main>
  );
}

type OptionProps = {
  inputRef?: Ref<HTMLInputElement>;
  name: Choice;
  checked: boolean;
  onSelect: () => void;
  title: string;
  description: string;
};

function Option({
  inputRef,
  name,
  checked,
  onSelect,
  title,
  description,
}: OptionProps) {
  const descriptionId = `device-${name}-description`;

  return (
    <div className="border border-neutral-300 p-4 has-checked:border-neutral-950">
      <label className="flex items-start gap-3">
        <input
          ref={inputRef}
          className="mt-1"
          type="radio"
          name="device"
          value={name}
          checked={checked}
          aria-describedby={descriptionId}
          onChange={onSelect}
        />
        <span>
          <span className="block font-semibold">{title}</span>
          <span id={descriptionId} className="mt-1 block text-sm leading-6">
            {description}
          </span>
        </span>
      </label>
    </div>
  );
}
