import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { DocumentPassed } from "./DocumentPassed";

const content = contentSchema.parse(bundled);

test("AC-03.5 a passing document lists each check and offers continue and retake", () => {
  const checks = [
    {
      id: "corners",
      label: content.document.result.passed.checks.corners,
      passed: true,
    },
    {
      id: "readable",
      label: content.document.result.passed.checks.readable,
      passed: true,
    },
    {
      id: "notExpired",
      label: content.document.result.passed.checks.notExpired,
      passed: true,
    },
  ];
  render(
    <ContentProvider content={content}>
      <DocumentPassed checks={checks} onContinue={vi.fn()} onRetake={vi.fn()} />
    </ContentProvider>,
  );

  expect(
    screen.getAllByRole("listitem").map((item) => item.textContent),
  ).toEqual(checks.map((check) => `✓ ${check.label}`));
  expect(
    screen.getByRole("button", { name: content.common.actions.continue }),
  ).toBeDefined();
  expect(
    screen.getByRole("button", { name: content.common.actions.retakePhoto }),
  ).toBeDefined();
});
