import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { CompleteScreen } from "./CompleteScreen";

const content = contentSchema.parse(bundled);

test("AC-05.6 the completed journey says you're verified", () => {
  render(
    <ContentProvider content={content}>
      <CompleteScreen />
    </ContentProvider>,
  );

  expect(
    screen.getByRole("heading", { name: content.complete.title }),
  ).toBeDefined();
  expect(screen.getByText(content.complete.body)).toBeDefined();
  expect(
    screen.getByRole("button", { name: content.complete.cta }),
  ).toBeDefined();
});
