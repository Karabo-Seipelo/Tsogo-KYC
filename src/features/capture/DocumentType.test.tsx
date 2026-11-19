import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { createT } from "../../lib/content/t";
import { DocumentType } from "./DocumentType";

const content = contentSchema.parse(bundled);
const t = createT(content);

test("AC-03.1 choosing a document sets its side count and arrows move the radios", async () => {
  const user = userEvent.setup();
  const onChoose = vi.fn();
  render(
    <ContentProvider content={content}>
      <DocumentType onChoose={onChoose} onContinue={vi.fn()} />
    </ContentProvider>,
  );

  const passport = radio(content.document.select.options.passport.title);
  const nationalId = radio(content.document.select.options.nationalId.title);
  const licence = radio(content.document.select.options.driversLicence.title);

  expect(
    screen.getByText(
      t("common.progress.label", {
        current: 1,
        total: 4,
        name: content.common.progress.steps.document,
      }),
    ),
  ).toBeDefined();

  await user.click(passport);
  expect(onChoose).toHaveBeenLastCalledWith({ type: "passport", sides: 1 });

  await user.keyboard("{ArrowDown}");
  expect(nationalId.checked).toBe(true);
  expect(onChoose).toHaveBeenLastCalledWith({
    type: "nationalId",
    sides: 2,
  });

  await user.keyboard("{ArrowDown}");
  expect(licence.checked).toBe(true);
  expect(onChoose).toHaveBeenLastCalledWith({
    type: "driversLicence",
    sides: 2,
  });
});

function radio(title: string) {
  const element = screen.getByRole("radio", {
    name: (name) => name.startsWith(title),
  });
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`${title} is not a radio input`);
  }
  return element;
}
