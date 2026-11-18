import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { contrastRatio } from "./contrast";

const css = readFileSync("src/app/globals.css", "utf8");

function token(name: string) {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!match?.[1]) {
    throw new Error(`missing colour token ${name}`);
  }
  return match[1];
}

const textPairs = [
  ["ink", "surface", 12.49],
  ["ink-muted", "surface", 6.05],
  ["ink-muted", "canvas", 5.55],
  ["gold-strong", "surface", 5.18],
  ["gold-bright", "ink", 7.74],
  ["on-ink", "ink", 12.49],
  ["success", "surface", 5.35],
  ["danger", "surface", 6.54],
  ["warning", "surface", 5.43],
  ["info", "surface", 7.03],
] as const;

test("AC-10.2 text on its background meets 4.5:1 and the published ratio", () => {
  for (const [foreground, background, published] of textPairs) {
    const ratio = contrastRatio(token(foreground), token(background));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeCloseTo(published, 2);
  }
});

test("AC-10.2 a control border meets 3:1 on white", () => {
  const ratio = contrastRatio(token("line-strong"), token("surface"));
  expect(ratio).toBeGreaterThanOrEqual(3);
  expect(ratio).toBeCloseTo(3.32, 2);
});

test("AC-10.2 gold on white stays below 3:1", () => {
  const ratio = contrastRatio(token("gold"), token("surface"));
  expect(ratio).toBeLessThan(3);
  expect(ratio).toBeCloseTo(2.69, 2);
});
