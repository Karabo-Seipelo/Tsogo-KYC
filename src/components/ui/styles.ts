export const screenTitle =
  "text-title font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-strong md:text-display";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-strong";

export const stateMotion =
  "transition duration-150 ease-out motion-reduce:transition-none";

export const panelMotion =
  "transition duration-[250ms] ease-out motion-reduce:transition-none";

export function classes(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}
