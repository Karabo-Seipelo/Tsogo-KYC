import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { QrHandoff } from "./QrHandoff";

const content = contentSchema.parse(bundled);

test("AC-02.3 the QR URL has the handoff token and the desktop host, and no session id", async () => {
  const user = userEvent.setup();
  const onContinueHere = vi.fn();
  const token = "a1b2c3d4e5f67890";
  const host = "preview.example";
  const url = `https://${host}/m/${token}`;

  render(
    <ContentProvider content={content}>
      <QrHandoff token={token} host={host} onContinueHere={onContinueHere} />
    </ContentProvider>,
  );

  const heading = screen.getByRole("heading", {
    level: 1,
    name: content.handoff.title,
  });
  expect(heading).toBe(document.activeElement);

  const steps = screen.getByRole("list");
  expect(steps.tagName).toBe("OL");
  for (const step of content.handoff.steps) {
    expect(screen.getByText(step).tagName).toBe("LI");
  }

  const qr = screen.getByRole("img", { name: content.handoff.qrAlt });
  const describedBy = qr.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy ?? "")?.textContent).toBe(url);
  expect(url).toContain(token);
  expect(url).not.toContain("session");

  expect(screen.getByText(content.handoff.waiting)).toBeDefined();

  await user.click(
    screen.getByRole("button", { name: content.handoff.fallback }),
  );
  expect(onContinueHere).toHaveBeenCalledOnce();
});

test("AC-02.4 Phone connected is announced when the phone has joined", () => {
  render(
    <ContentProvider content={content}>
      <QrHandoff
        token="a1b2c3d4e5f67890"
        host="preview.example"
        onContinueHere={vi.fn()}
        phoneConnected
      />
    </ContentProvider>,
  );

  const announced = screen.getByRole("status");
  expect(announced.textContent).toBe(content.handoff.connected);
  expect(announced.getAttribute("aria-live")).toBe("polite");
  expect(screen.queryByText(content.handoff.waiting)).toBeNull();
});

test("AC-02.4 the connection status is already live while waiting", () => {
  const props = {
    token: "a1b2c3d4e5f67890",
    host: "preview.example",
    onContinueHere: vi.fn(),
  };
  const { rerender } = render(
    <ContentProvider content={content}>
      <QrHandoff {...props} />
    </ContentProvider>,
  );

  const announced = screen.getByRole("status");
  expect(announced.textContent).toBe(content.handoff.waiting);
  expect(announced.getAttribute("aria-live")).toBe("polite");

  rerender(
    <ContentProvider content={content}>
      <QrHandoff {...props} phoneConnected />
    </ContentProvider>,
  );

  expect(screen.getByRole("status")).toBe(announced);
  expect(announced.textContent).toBe(content.handoff.connected);
});
