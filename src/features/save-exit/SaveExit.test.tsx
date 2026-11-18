import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { Journey } from "../../features/start/Journey";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { saveWindowMinutes } from "./SaveExit";

const content = contentSchema.parse(bundled);

function withMinutes(template: string) {
  return template.replaceAll("{minutes}", String(saveWindowMinutes));
}

test("AC-02.11 Keep going or Escape leaves the screen unchanged", async () => {
  const user = userEvent.setup();
  render(
    <ContentProvider content={content}>
      <Journey />
    </ContentProvider>,
  );
  const save = screen.getByRole("button", {
    name: content.common.header.saveAndExit,
  });

  await user.click(save);

  expect(document.activeElement).toBe(
    screen.getByRole("heading", { name: content.saveExit.confirmTitle }),
  );
  expect(
    screen.getByText(withMinutes(content.saveExit.confirmBody)),
  ).toBeDefined();
  expect(
    screen.getByRole("heading", { name: content.start.title, level: 1 }),
  ).toBeDefined();

  const keepGoing = screen.getByRole("button", {
    name: content.saveExit.cancel,
  });
  const confirm = screen.getByRole("button", {
    name: content.saveExit.confirm,
  });
  await user.tab();
  expect(document.activeElement).toBe(keepGoing);
  await user.tab();
  expect(document.activeElement).toBe(confirm);
  await user.tab();
  expect(document.activeElement).toBe(keepGoing);

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(save);
  expect(
    screen.getByRole("heading", { name: content.start.title, level: 1 }),
  ).toBeDefined();

  await user.click(save);
  await user.click(
    screen.getByRole("button", { name: content.saveExit.cancel }),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(save);
  expect(
    screen.getByRole("heading", { name: content.start.title, level: 1 }),
  ).toBeDefined();
});

test("AC-02.10 confirming Save & exit shows how long progress is kept", async () => {
  const user = userEvent.setup();
  render(
    <ContentProvider content={content}>
      <Journey />
    </ContentProvider>,
  );

  await user.click(
    screen.getByRole("button", { name: content.common.header.saveAndExit }),
  );
  await user.click(
    screen.getByRole("button", { name: content.saveExit.confirm }),
  );

  const saved = screen.getByRole("heading", {
    name: content.saveExit.savedTitle,
    level: 1,
  });
  expect(document.activeElement).toBe(saved);
  expect(
    screen.getByText(withMinutes(content.saveExit.savedBody)),
  ).toBeDefined();
  expect(
    screen.getByRole("link", { name: content.saveExit.return }),
  ).toBeDefined();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(
    screen.queryByRole("heading", { name: content.start.title, level: 1 }),
  ).toBeNull();
});
