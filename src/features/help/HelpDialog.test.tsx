import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { Journey } from "../../features/start/Journey";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";

const content = contentSchema.parse(bundled);

test("AC-02.9 Help opens, traps focus, and returns focus without leaving the screen", async () => {
  const user = userEvent.setup();
  render(
    <ContentProvider content={content}>
      <Journey />
    </ContentProvider>,
  );
  const help = screen.getByRole("button", { name: content.common.header.help });

  await user.click(help);

  const heading = screen.getByRole("heading", { name: content.help.title });
  expect(document.activeElement).toBe(heading);
  for (const item of content.help.faq) {
    expect(screen.getByRole("heading", { name: item.q })).toBeDefined();
    expect(screen.getByText(item.a)).toBeDefined();
  }
  expect(screen.getByText(content.help.support)).toBeDefined();
  expect(
    screen.getByRole("link", { name: content.help.privacyLink }),
  ).toHaveProperty("href", expect.stringContaining("/privacy"));
  expect(
    screen.getByRole("heading", { name: content.start.title, level: 1 }),
  ).toBeDefined();

  const close = screen.getByRole("button", { name: content.help.close });
  const privacy = screen.getByRole("link", { name: content.help.privacyLink });
  await user.tab();
  expect(document.activeElement).toBe(privacy);
  await user.tab();
  expect(document.activeElement).toBe(close);
  await user.tab();
  expect(document.activeElement).toBe(privacy);

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(help);
  expect(
    screen.getByRole("heading", { name: content.start.title, level: 1 }),
  ).toBeDefined();

  await user.click(help);
  await user.click(screen.getByRole("button", { name: content.help.close }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(help);
});
