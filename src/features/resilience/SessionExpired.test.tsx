import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { createT } from "../../lib/content/t";
import { SessionExpired } from "./SessionExpired";
import { TimeoutWarning, countdownLabel, shouldWarn } from "./TimeoutWarning";

const content = contentSchema.parse(bundled);
const t = createT(content);

test("AC-06.3 two minutes left opens the warning, traps focus, and Escape stays", async () => {
  const user = userEvent.setup();
  const onStay = vi.fn();
  const onEnd = vi.fn();
  const { rerender } = render(
    <ContentProvider content={content}>
      <button type="button">Outside</button>
      <TimeoutWarning remainingMs={120_000} onStay={onStay} onEnd={onEnd} />
    </ContentProvider>,
  );

  const heading = screen.getByRole("heading", {
    name: content.errors.SESSION_TIMEOUT_WARNING.title,
  });
  expect(screen.getByRole("alertdialog")).toBeDefined();
  expect(document.activeElement).toBe(heading);
  expect(screen.getByText(warningBody(120_000))).toBeDefined();

  const stay = screen.getByRole("button", {
    name: content.errors.SESSION_TIMEOUT_WARNING.stay,
  });
  const end = screen.getByRole("button", {
    name: content.errors.SESSION_TIMEOUT_WARNING.end,
  });
  await user.tab();
  expect(document.activeElement).toBe(stay);
  await user.tab();
  expect(document.activeElement).toBe(end);
  await user.tab();
  expect(document.activeElement).toBe(stay);
  expect(screen.getByRole("button", { name: "Outside" })).not.toBe(
    document.activeElement,
  );

  await user.keyboard("{Escape}");
  expect(onStay).toHaveBeenCalledOnce();
  expect(onEnd).not.toHaveBeenCalled();

  rerender(
    <ContentProvider content={content}>
      <TimeoutWarning remainingMs={100_000} onStay={onStay} onEnd={onEnd} />
    </ContentProvider>,
  );
  expect(screen.getByText(warningBody(120_000))).toBeDefined();

  rerender(
    <ContentProvider content={content}>
      <TimeoutWarning remainingMs={90_000} onStay={onStay} onEnd={onEnd} />
    </ContentProvider>,
  );
  expect(screen.getByText(warningBody(90_000))).toBeDefined();
  expect(countdownLabel(100_000)).toBe(countdownLabel(120_000));
  expect(countdownLabel(90_000)).toBe("1:30");
});

test("R-06.3 the warning opens at 2 minutes, or at 30 seconds when ttl=1", () => {
  expect(shouldWarn(120_000, null)).toBe(true);
  expect(shouldWarn(120_001, null)).toBe(false);
  expect(shouldWarn(30_000, 1)).toBe(true);
  expect(shouldWarn(30_001, 1)).toBe(false);
  expect(shouldWarn(45_000, 1)).toBe(false);
});

test("AC-06.4 an expired session says nothing was submitted and can start again", async () => {
  const user = userEvent.setup();
  const onRestart = vi.fn();
  render(
    <ContentProvider content={content}>
      <SessionExpired minutes={15} onRestart={onRestart} />
    </ContentProvider>,
  );

  const heading = screen.getByRole("heading", {
    name: content.errors.SESSION_EXPIRED.title,
  });
  expect(document.activeElement).toBe(heading);
  expect(screen.getByText(expiredBody(15))).toBeDefined();
  expect(expiredBody(1)).toContain("Nothing was submitted");

  await user.click(
    screen.getByRole("button", { name: content.errors.SESSION_EXPIRED.cta }),
  );
  expect(onRestart).toHaveBeenCalledOnce();
});

function warningBody(remainingMs: number) {
  return t("errors.SESSION_TIMEOUT_WARNING.body", {
    time: countdownLabel(remainingMs),
  });
}

function expiredBody(minutes: number) {
  return t("errors.SESSION_EXPIRED.body", { minutes, min: 3, max: 5 });
}
