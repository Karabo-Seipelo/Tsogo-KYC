import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { contentSchema } from "../../lib/content/schema";
import { createT } from "../../lib/content/t";
import Page from "./page";

const content = contentSchema.parse(bundled);
const t = createT(content);

test("AC-02.12 /privacy shows every notice section and a way back to the journey", () => {
  render(<Page />);

  expect(
    screen.getByRole("heading", { level: 1, name: content.privacy.title }),
  ).toBe(document.activeElement);
  expect(screen.getByText(content.privacy.demo)).toBeDefined();
  for (const section of content.privacy.sections) {
    expect(
      screen.getByRole("heading", { name: section.heading }),
    ).toBeDefined();
    expect(screen.getByText(section.body)).toBeDefined();
  }
  expect(
    screen
      .getByRole("link", { name: content.privacy.back })
      .getAttribute("href"),
  ).toBe("/");
  expect(document.title).toBe(
    t("common.documentTitle", {
      screen: content.privacy.title,
      site: content.common.header.title,
    }),
  );
});
