import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { createT } from "../../lib/content/t";
import { DemoBanner } from "../DemoBanner";
import { Header } from "../Header";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { OptionCard } from "./OptionCard";
import { Progress } from "./Progress";
import { StatusRow } from "./StatusRow";

const content = contentSchema.parse(bundled);
const t = createT(content);

function renderWith(node: ReactNode) {
  return render(<ContentProvider content={content}>{node}</ContentProvider>);
}

test("AC-10.3 AC-10.4 a button shows the gold focus ring and drops its transition when motion is reduced", () => {
  render(<Button>Continue</Button>);
  const button = screen.getByRole("button", { name: "Continue" });
  expect(button.className).toContain("outline-gold-strong");
  expect(button.className).toContain("outline-offset-2");
  expect(button.className).toContain("duration-150");
  expect(button.className).toContain("motion-reduce:transition-none");
});

test("R-10.5 button variants, loading and disabled", () => {
  const { rerender } = render(
    <Button variant="secondary" disabled>
      Back
    </Button>,
  );
  const disabled = screen.getByRole("button", { name: "Back" });
  expect(disabled.hasAttribute("disabled")).toBe(true);
  expect(disabled.className).toContain("border-line-strong");

  rerender(
    <Button variant="text" loading>
      Help
    </Button>,
  );
  const loading = screen.getByRole("button", { name: "…" });
  expect(loading.getAttribute("aria-busy")).toBe("true");
  expect(loading.className).toContain("text-gold-strong");
});

test("R-10.5 a selected option card uses an ink border and a tick", () => {
  render(
    <OptionCard
      name="document"
      value="passport"
      checked
      onChange={() => undefined}
      title="Passport"
      description="Photo page only"
    />,
  );
  const card = screen.getByRole("radio", { name: /Passport/ }).closest("label");
  expect(card?.className).toContain("border-ink");
  expect(card?.className).not.toContain("border-gold ");
  expect(card?.querySelector("svg")).toBeTruthy();
  expect(card?.className).toContain("outline-gold-strong");
});

test("R-10.5 progress names the step and fills that many segments", () => {
  renderWith(<Progress current={1} total={4} name="Your document" />);
  expect(
    screen.getByText(
      t("common.progress.label", {
        current: 1,
        total: 4,
        name: "Your document",
      }),
    ),
  ).toBeDefined();
  const segments = document.querySelectorAll(".bg-gold-strong");
  const empty = document.querySelectorAll(".bg-line");
  expect(segments).toHaveLength(1);
  expect(empty).toHaveLength(3);
});

test("R-10.5 an alert pairs an icon with its title", () => {
  render(<Alert tone="danger" title="We couldn't read that" />);
  const alert = screen.getByRole("alert");
  expect(alert.textContent).toContain("We couldn't read that");
  expect(alert.querySelector("svg")).toBeTruthy();
  expect(alert.className).toContain("border-l-4");
  expect(alert.className).toContain("bg-danger-soft");
});

test("R-10.5 a status row shows an icon and the status text", () => {
  renderWith(<StatusRow label="Document photo taken" status="inProgress" />);
  expect(screen.getByText("Document photo taken").className).toContain(
    "font-semibold",
  );
  expect(screen.getByText(content.common.status.inProgress)).toBeDefined();
  expect(document.querySelector("svg")).toBeTruthy();
});

test("AC-10.4 a dialog panel transition is removed when motion is reduced", () => {
  const onClose = vi.fn();
  renderWith(
    <Dialog
      title="Still there?"
      labelledBy="timeout-title"
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary">End session</Button>
          <Button>Stay</Button>
        </>
      }
    >
      Body
    </Dialog>,
  );
  const dialog = screen.getByRole("dialog");
  expect(dialog.className).toContain("duration-[250ms]");
  expect(dialog.className).toContain("motion-reduce:transition-none");
  expect(dialog.className).toContain("shadow-dialog");
  expect(screen.getByRole("heading", { name: "Still there?" })).toBe(
    document.activeElement,
  );
  const buttons = screen.getAllByRole("button");
  expect(buttons[buttons.length - 1]?.textContent).toBe("Stay");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(onClose).toHaveBeenCalledOnce();
});

test("R-10.5 the demo banner keeps the long and short copy", () => {
  renderWith(<DemoBanner />);
  expect(screen.getByText(content.common.demoBanner.long).className).toContain(
    "md:inline",
  );
  expect(screen.getByText(content.common.demoBanner.short).className).toContain(
    "md:hidden",
  );
  expect(
    screen.getByText(content.common.demoBanner.long).parentElement?.className,
  ).toContain("bg-ink");
  expect(
    screen.getByText(content.common.demoBanner.long).parentElement?.className,
  ).toContain("text-gold-bright");
});

test("AC-10.3 the header actions use the gold focus ring", () => {
  const onHelp = vi.fn();
  const onSaveExit = vi.fn();
  renderWith(<Header onHelp={onHelp} onSaveExit={onSaveExit} />);
  const help = screen.getByRole("button", { name: content.common.header.help });
  const save = screen.getByRole("button", {
    name: content.common.header.saveAndExit,
  });
  expect(help.className).toContain("outline-gold-strong");
  expect(help.className).toContain("motion-reduce:transition-none");
  expect(save.className).toContain("hidden");
  fireEvent.click(help);
  expect(onHelp).toHaveBeenCalledOnce();
});
