// WCAG 2.2 contrast ratio: (L1 + 0.05) / (L2 + 0.05), from relative luminance.
// https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio

const srgbThreshold = 0.04045;

export function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex: string) {
  const [red, green, blue] = channels(hex);
  return (
    0.2126 * linearize(red) +
    0.7152 * linearize(green) +
    0.0722 * linearize(blue)
  );
}

function channels(hex: string): [number, number, number] {
  const value = hex.slice(1);
  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ];
}

function linearize(channel: number) {
  if (channel <= srgbThreshold) {
    return channel / 12.92;
  }
  return ((channel + 0.055) / 1.055) ** 2.4;
}
