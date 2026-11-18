"use client";

import { classes, stateMotion } from "./styles";

type Props = {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description?: string;
};

export function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
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
      className="mt-0.5 flex shrink-0 items-center gap-2"
      aria-hidden="true"
    >
      <span
        className={classes(
          "grid size-5 place-items-center rounded-full border-2 border-ink",
          checked && "bg-ink",
        )}
      >
        {checked ? <span className="size-2 rounded-full bg-on-ink" /> : null}
      </span>
      {checked ? <Tick /> : null}
    </span>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 text-ink" aria-hidden="true">
      <path
        d="M3 8.2 6.2 11.5 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
