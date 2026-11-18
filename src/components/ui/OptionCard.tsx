"use client";

import type { Ref } from "react";
import { classes, stateMotion } from "./styles";

type Props = {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description?: string;
  inputRef?: Ref<HTMLInputElement>;
};

export function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  inputRef,
}: Props) {
  return (
    <label
      className={classes(
        "flex cursor-pointer gap-3 rounded-lg border-2 bg-surface p-4",
        checked ? "border-ink" : "border-line-strong",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-strong",
        stateMotion,
      )}
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <RadioMark checked={checked} />
      <span>
        <span className="block text-base font-semibold">{title}</span>
        {description ? (
          <span className="mt-1 block text-sm text-ink-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={classes(
        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink",
        checked && "bg-ink",
      )}
      aria-hidden="true"
    >
      {checked ? <span className="size-2 rounded-full bg-on-ink" /> : null}
    </span>
  );
}
