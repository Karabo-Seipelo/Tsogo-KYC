import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { createT } from "../../lib/content/t";
import { LivenessCheck, livenessPromptMs } from "./LivenessCheck";

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

test("AC-04.4 a prompt stays up for at least 10 seconds and help opens", async () => {
  expect(livenessPromptMs).toBeGreaterThanOrEqual(10_000);
  vi.useFakeTimers();
  renderLiveness(vi.fn());
  const first = document.querySelector("[aria-live='polite']")?.textContent;

  act(() => {
    screen.getByRole("button", { name: content.liveness.help }).click();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(9_999);
  });

  expect(document.querySelector("[aria-live='polite']")?.textContent).toBe(
    first,
  );
  expect(screen.getByText(progress(1))).toBeDefined();
  expect(
    screen.getByRole("heading", { name: content.help.title }),
  ).toBeDefined();
});

function renderLiveness(onPassed: () => void) {
  render(
    <ContentProvider content={content}>
      <LivenessCheck onPassed={onPassed} />
    </ContentProvider>,
  );
}

function progress(current: number) {
  return t("liveness.progress", { current, total: 3 });
}
