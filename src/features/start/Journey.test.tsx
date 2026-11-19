import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { createT } from "../../lib/content/t";
import { Journey } from "./Journey";

const content = contentSchema.parse(bundled);
const t = createT(content);

function titled(screenTitle: string) {
  return t("common.documentTitle", {
    screen: screenTitle,
    site: content.common.header.title,
  });
}

test("AC-09.8 the document title names the screen and changes with the step", async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })),
  );

  render(
    <ContentProvider content={content}>
      <Journey />
    </ContentProvider>,
  );

  expect(document.title).toBe(titled(content.start.title));

  await user.click(screen.getByRole("button", { name: content.start.cta }));

  expect(document.title).toBe(titled(content.device.title));
  expect(document.title).not.toBe(titled(content.start.title));
});
