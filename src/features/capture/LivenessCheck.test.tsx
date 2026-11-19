import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { createT } from "../../lib/content/t";
import { HelpProvider } from "../help/HelpDialog";
import {
  LivenessCheck,
  livenessConfirmMs,
  livenessPromptMs,
} from "./LivenessCheck";

const content = contentSchema.parse(bundled);
const t = createT(content);
const prompts = [
  content.liveness.prompts.turnLeft,
  content.liveness.prompts.turnRight,
  content.liveness.prompts.blink,
];

afterEach(() => {
  vi.useRealTimers();
});

test("AC-04.3 prompts appear one at a time and are announced", async () => {
  vi.useFakeTimers();
  const onPassed = vi.fn();
  renderLiveness(onPassed);
  const seen = new Set<string>();

  for (let current = 1; current <= 3; current += 1) {
    expect(screen.getByText(progress(current)).textContent).toBe(
      progress(current),
    );
    const announced = document.querySelector("[aria-live='polite']");
    expect(announced?.textContent).toBeTruthy();
    expect(prompts).toContain(announced?.textContent);
    seen.add(announced?.textContent ?? "");
    expect(prompts.filter((prompt) => screen.queryByText(prompt))).toHaveLength(
      1,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(livenessPromptMs);
    });
  }

  expect(seen.size).toBe(3);
  expect(onPassed).toHaveBeenCalledOnce();
});

test("AC-04.4 waiting cannot fail the check, and help stays available", async () => {
  vi.useFakeTimers();
  const onPassed = vi.fn();
  renderLiveness(onPassed);

  act(() => {
    screen.getByRole("button", { name: content.liveness.help }).click();
  });
  expect(
    screen.getByRole("heading", { name: content.help.title }),
  ).toBeDefined();

  for (let step = 0; step < 3; step += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(livenessPromptMs);
    });
  }

  expect(onPassed).toHaveBeenCalledOnce();
});

test("AC-04.10 Got it is announced within 4 seconds and the check takes 10 to 15 seconds", async () => {
  expect(livenessConfirmMs).toBeLessThanOrEqual(4_000);
  expect(livenessPromptMs * 3).toBeGreaterThanOrEqual(10_000);
  expect(livenessPromptMs * 3).toBeLessThanOrEqual(15_000);
  vi.useFakeTimers();
  const onPassed = vi.fn();
  renderLiveness(onPassed);
  const first = document.querySelector("[aria-live='polite']")?.textContent;

  await act(async () => {
    await vi.advanceTimersByTimeAsync(livenessConfirmMs);
  });

  const announced = document.querySelector("[aria-live='polite']");
  expect(announced?.textContent).toBe(content.liveness.confirmed);
  expect(announced?.getAttribute("aria-live")).toBe("polite");

  await act(async () => {
    await vi.advanceTimersByTimeAsync(livenessPromptMs - livenessConfirmMs);
  });

  expect(document.querySelector("[aria-live='polite']")?.textContent).not.toBe(
    first,
  );
  expect(onPassed).not.toHaveBeenCalled();

  for (let step = 0; step < 2; step += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(livenessPromptMs);
    });
  }
  expect(onPassed).toHaveBeenCalledOnce();
});

function renderLiveness(onPassed: () => void) {
  render(
    <ContentProvider content={content}>
      <HelpProvider>
        <LivenessCheck onPassed={onPassed} />
      </HelpProvider>
    </ContentProvider>,
  );
}

function progress(current: number) {
  return t("liveness.progress", { current, total: 3 });
}
