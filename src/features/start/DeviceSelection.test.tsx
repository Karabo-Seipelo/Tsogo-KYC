import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { DeviceSelection } from "./DeviceSelection";

const content = contentSchema.parse(bundled);

test("AC-02.2 Use my phone is selected and the options move with arrow keys", async () => {
  const user = userEvent.setup();
  renderScreen();

  const phone = radio(content.device.options.phone.title);
  const computer = radio(content.device.options.thisDevice.title);

  expect(phone.checked).toBe(true);
  expect(phone).toBe(document.activeElement);

  await user.keyboard("{ArrowDown}");
  expect(computer.checked).toBe(true);

  await user.keyboard("{ArrowUp}");
  expect(phone.checked).toBe(true);
});

test("choosing this computer continues and the phone choice does not open a QR screen", async () => {
  const user = userEvent.setup();
  const onChooseThisDevice = vi.fn();
  renderScreen(onChooseThisDevice);

  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(onChooseThisDevice).not.toHaveBeenCalled();
  expect(screen.queryByText(content.handoff.title)).toBeNull();

  await user.click(radio(content.device.options.thisDevice.title));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(onChooseThisDevice).toHaveBeenCalledOnce();
  expect(screen.queryByText(content.handoff.title)).toBeNull();
});

function renderScreen(onChooseThisDevice = vi.fn()) {
  render(
    <ContentProvider content={content}>
      <DeviceSelection onChooseThisDevice={onChooseThisDevice} />
    </ContentProvider>,
  );
}

function radio(title: string) {
  const element = screen.getByRole("radio", {
    name: (name) => name.startsWith(title),
  });
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`${title} is not a radio input`);
  }
  return element;
}
