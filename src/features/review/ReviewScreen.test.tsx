import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { ReviewScreen, type ReviewCheck } from "./ReviewScreen";

const content = contentSchema.parse(bundled);

const checks: ReviewCheck[] = [
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

test("R-05.3 review shows the document, both photos, and each result", () => {
  renderReview();

  expect(
    screen.getByRole("heading", { name: content.review.title }),
  ).toBeDefined();
  expect(
    screen.getByText(content.document.select.options.nationalId.title),
  ).toBeDefined();
  expect(
    screen.getByRole("img", { name: content.faceMatch.documentPhoto }),
  ).toHaveProperty("src", expect.stringContaining("document.jpg"));
  expect(
    screen.getByRole("img", { name: content.faceMatch.selfie }),
  ).toHaveProperty("src", expect.stringContaining("selfie.jpg"));
  for (const check of checks) {
    expect(screen.getByText(check.label, { exact: false })).toBeDefined();
  }
  expect(screen.getByText(content.review.rows.liveness)).toBeDefined();
  expect(screen.getByText(content.review.rows.faceMatch)).toBeDefined();
  expect(
    screen.getAllByText(content.common.status.passed).length,
  ).toBeGreaterThan(0);
});

test("AC-05.7 a failed or missing result is not shown as passed", () => {
  render(
    <ContentProvider content={content}>
      <ReviewScreen
        {...props()}
        checks={[
          {
            id: "corners",
            label: content.document.result.passed.checks.corners,
            passed: false,
          },
        ]}
        livenessPassed={false}
        matched={false}
        onRetake={vi.fn()}
        onSubmit={vi.fn()}
      />
    </ContentProvider>,
  );

  expect(rowText(content.document.result.passed.checks.corners)).not.toContain(
    content.common.status.passed,
  );
  expect(rowText(content.review.rows.liveness)).not.toContain(
    content.common.status.passed,
  );
  expect(rowText(content.review.rows.faceMatch)).not.toContain(
    content.common.status.passed,
  );
});

test("AC-05.4 submit stays disabled until the confirmation is ticked", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  renderReview(onSubmit);

  const submit = screen.getByRole("button", { name: content.review.submit });
  expect(submit).toHaveProperty("disabled", true);
  expect(submit.getAttribute("aria-describedby")).toBe(
    screen.getByText(content.review.confirmRequired).id,
  );

  await user.click(
    screen.getByRole("checkbox", { name: content.review.confirm }),
  );

  expect(submit).toHaveProperty("disabled", false);
  expect(submit.getAttribute("aria-describedby")).toBeNull();
  await user.click(submit);
  expect(onSubmit).toHaveBeenCalledOnce();
});

test("AC-05.5 retake names the capture and leaves the other photo in place", async () => {
  const user = userEvent.setup();
  const onRetake = vi.fn();
  render(
    <ContentProvider content={content}>
      <ReviewScreen {...props()} onRetake={onRetake} onSubmit={vi.fn()} />
    </ContentProvider>,
  );

  await user.click(
    screen.getByRole("button", { name: retake(content.review.rows.document) }),
  );
  expect(onRetake).toHaveBeenCalledWith("document");
  expect(
    screen.getByRole("img", { name: content.faceMatch.selfie }),
  ).toBeDefined();

  await user.click(
    screen.getByRole("button", { name: retake(content.faceMatch.selfie) }),
  );
  expect(onRetake).toHaveBeenCalledWith("selfie");
  expect(
    screen.getByRole("img", { name: content.faceMatch.documentPhoto }),
  ).toBeDefined();
});

function renderReview(onSubmit: () => void = () => undefined) {
  render(
    <ContentProvider content={content}>
      <ReviewScreen {...props()} onRetake={vi.fn()} onSubmit={onSubmit} />
    </ContentProvider>,
  );
}

function props() {
  return {
    documentType: "nationalId" as const,
    documentSrc: "https://photos.example/document.jpg",
    selfieSrc: "https://photos.example/selfie.jpg",
    checks,
    livenessPassed: true,
    matched: true,
  };
}

function rowText(label: string) {
  return screen.getByText(label).parentElement?.textContent ?? "";
}

function retake(capture: string) {
  return `${content.review.retake} ${capture}`;
}
