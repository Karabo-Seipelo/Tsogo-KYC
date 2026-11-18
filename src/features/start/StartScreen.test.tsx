import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { StartScreen } from "./StartScreen";

const content = contentSchema.parse(bundled);

test("AC-02.1 D1 shows the estimate, the requirements, the privacy line and Start verification", () => {
  render(
    <ContentProvider content={content}>
      <StartScreen />
    </ContentProvider>,
  );

  const heading = screen.getByRole("heading", {
    level: 1,
    name: content.start.title,
  });
  expect(heading).toBe(document.activeElement);
  expect(
    screen.getByText(
      content.start.estimate.replace("{min}", "3").replace("{max}", "5"),
    ),
  ).toBeDefined();
  expect(screen.getByRole("list").tagName).toBe("UL");
  for (const item of content.start.requirements) {
    expect(screen.getByText(item).tagName).toBe("LI");
  }
  expect(screen.getByText(content.start.privacy)).toBeDefined();
  expect(
    screen
      .getByRole("link", { name: content.start.privacyLink })
      .getAttribute("href"),
  ).toBe("/privacy");
  expect(screen.getByRole("button", { name: content.start.cta })).toBeDefined();
});
