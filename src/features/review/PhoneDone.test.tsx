import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { PhoneDone } from "./PhoneDone";

const content = contentSchema.parse(bundled);

test("R-05.2 the phone tells the user to go back to the computer", () => {
  render(
    <ContentProvider content={content}>
      <PhoneDone />
    </ContentProvider>,
  );

  expect(
    screen.getByRole("heading", { level: 1, name: content.phoneDone.title }),
  ).toBe(document.activeElement);
  expect(screen.getByText(content.phoneDone.body)).toBeDefined();
});
