import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import {
  ProcessingScreen,
  slowAfterMs,
  statusPollMs,
} from "./ProcessingScreen";

const content = contentSchema.parse(bundled);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("R-05.5 processing shows the usual message, then the slow one after 2 minutes", async () => {
  vi.useFakeTimers();
  stubStatus("processing");
  renderProcessing(vi.fn());

  expect(screen.getByRole("status").textContent).toBe(content.processing.body);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(slowAfterMs - 1);
  });
  expect(screen.getByRole("status").textContent).toBe(content.processing.body);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(screen.getByRole("status").textContent).toBe(content.processing.slow);
});

test("AC-05.6 a completed status poll leaves processing", async () => {
  vi.useFakeTimers();
  const onComplete = vi.fn();
  const step = stubStatus("processing");
  renderProcessing(onComplete);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(statusPollMs);
  });
  expect(onComplete).not.toHaveBeenCalled();

  step.current = "complete";
  await act(async () => {
    await vi.advanceTimersByTimeAsync(statusPollMs);
  });
  expect(onComplete).toHaveBeenCalledOnce();
});

function renderProcessing(onComplete: () => void) {
  render(
    <ContentProvider content={content}>
      <ProcessingScreen onComplete={onComplete} />
    </ContentProvider>,
  );
}

function stubStatus(initial: string) {
  const step = { current: initial };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        step: step.current,
        phoneConnected: false,
        lastSeen: null,
        checks: [],
        handoffExpired: false,
      }),
    ),
  );
  return step;
}
