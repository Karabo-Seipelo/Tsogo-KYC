import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { createT } from "../../lib/content/t";
import { ManualReview, manualReviewHours } from "./ManualReview";

const content = contentSchema.parse(bundled);
const t = createT(content);

test("AC-08.3 manual review shows the reference and timeframe, with no retry", () => {
  render(
    <ContentProvider content={content}>
      <ManualReview reference="AB12" />
    </ContentProvider>,
  );

  const heading = screen.getByRole("heading", {
    name: content.manualReview.title,
  });
  expect(document.activeElement).toBe(heading);
  expect(
    screen.getByText(t("manualReview.body", { hours: manualReviewHours })),
  ).toBeDefined();
  expect(
    screen.getByText(t("manualReview.reference", { reference: "AB12" })),
  ).toBeDefined();
  expect(
    screen.getByRole("button", { name: content.manualReview.cta }),
  ).toBeDefined();
  expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
});
