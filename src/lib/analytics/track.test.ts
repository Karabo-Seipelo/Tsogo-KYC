import { expect, test, vi } from "vitest";
import { track } from "./track";

test("AC-08.1 a viewed, failed and retried step is recorded in order", () => {
  const lines = recorded(() => {
    track("kyc_step_viewed", { step: "document" });
    track("kyc_step_failed", { step: "document", reason: "blurry" });
    track("kyc_retry", { step: "document", attempt: 1 });
  });

  expect(lines).toEqual([
    { event: "kyc_step_viewed", step: "document" },
    { event: "kyc_step_failed", step: "document", reason: "blurry" },
    { event: "kyc_retry", step: "document", attempt: 1 },
  ]);
});

test("AC-08.1 kyc_started records the device only", () => {
  expect(recorded(() => track("kyc_started", { device: "phone" }))).toEqual([
    { event: "kyc_started", device: "phone" },
  ]);
});

test("AC-08.1 kyc_device_selected records the choice only", () => {
  expect(
    recorded(() => track("kyc_device_selected", { choice: "this_device" })),
  ).toEqual([{ event: "kyc_device_selected", choice: "this_device" }]);
});

test("AC-08.1 kyc_handoff_completed records the scan time only", () => {
  expect(
    recorded(() => track("kyc_handoff_completed", { secondsToScan: 12 })),
  ).toEqual([{ event: "kyc_handoff_completed", secondsToScan: 12 }]);
});

test("AC-08.1 kyc_manual_review records the step only", () => {
  expect(
    recorded(() => track("kyc_manual_review", { step: "document" })),
  ).toEqual([{ event: "kyc_manual_review", step: "document" }]);
});

test("AC-08.1 kyc_submitted records the elapsed time only", () => {
  expect(
    recorded(() => track("kyc_submitted", { secondsSinceStart: 90 })),
  ).toEqual([{ event: "kyc_submitted", secondsSinceStart: 90 }]);
});

test("AC-08.1 kyc_completed records the result only", () => {
  expect(
    recorded(() => track("kyc_completed", { result: "rejected" })),
  ).toEqual([{ event: "kyc_completed", result: "rejected" }]);
});

function recorded(run: () => void) {
  const lines: unknown[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((line: unknown) => {
    lines.push(line);
  });
  try {
    run();
  } finally {
    spy.mockRestore();
  }
  return lines;
}
