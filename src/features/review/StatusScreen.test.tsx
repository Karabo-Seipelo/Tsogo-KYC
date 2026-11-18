import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { statusPollMs, useStatusPoll } from "../handoff/useStatusPoll";
import { StatusScreen } from "./StatusScreen";

const content = contentSchema.parse(bundled);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("AC-05.1 AC-05.2 a step change shows within one poll as icon and text", async () => {
  vi.useFakeTimers();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(statusBody("documentUpload", true))
    .mockResolvedValue(statusBody("selfieCapture", true));
  vi.stubGlobal("fetch", fetchMock);

  render(
    <ContentProvider content={content}>
      <PolledStatus onReview={vi.fn()} />
    </ContentProvider>,
  );

  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(screen.getByText(content.status.steps.documentCaptured)).toBeDefined();
  expect(screen.getAllByText(content.common.status.inProgress)).toHaveLength(1);
  expect(screen.getByText("●")).toBeDefined();
  expect(screen.getAllByText("✓").length).toBeGreaterThan(0);
  expect(screen.getAllByText("○").length).toBeGreaterThan(0);
  expect(liveText()).toContain(content.status.steps.documentCaptured);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(statusPollMs);
  });
  expect(liveText()).toContain(content.status.steps.selfie);
  expect(liveText()).toContain(content.common.status.inProgress);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("AC-02.7 a lost phone shows the QR action and returns when the phone is back", async () => {
  const user = userEvent.setup();
  const onShowQr = vi.fn();
  const { rerender } = renderScreen({
    step: "documentUpload",
    phoneConnected: false,
    onShowQr,
  });

  expect(
    screen.getByRole("heading", { name: content.status.disconnected.label }),
  ).toBe(document.activeElement);
  expect(screen.getByText(content.status.disconnected.body)).toBeDefined();
  expect(screen.getByRole("status").textContent).toBe(
    content.status.disconnected.reconnecting,
  );
  await user.click(
    screen.getByRole("button", { name: content.status.disconnected.cta }),
  );
  expect(onShowQr).toHaveBeenCalledOnce();

  rerender(
    <ContentProvider content={content}>
      <StatusScreen
        step="documentUpload"
        phoneConnected
        onShowQr={onShowQr}
        onReview={vi.fn()}
      />
    </ContentProvider>,
  );
  expect(
    screen.getByRole("heading", { name: content.status.title }),
  ).toBeDefined();
  expect(screen.getByText(content.status.steps.phoneConnected)).toBeDefined();
});

test("AC-05.3 a review step asks the desktop to open review", () => {
  const onReview = vi.fn();
  renderScreen({ step: "review", phoneConnected: true, onReview });
  expect(onReview).toHaveBeenCalledOnce();
});

function PolledStatus({ onReview }: { onReview: () => void }) {
  const status = useStatusPoll();
  if (!status) {
    return null;
  }
  return (
    <StatusScreen
      step={status.step}
      phoneConnected={status.phoneConnected}
      onShowQr={() => undefined}
      onReview={onReview}
    />
  );
}

function renderScreen({
  step,
  phoneConnected,
  onShowQr = vi.fn(),
  onReview = vi.fn(),
}: {
  step: string;
  phoneConnected: boolean;
  onShowQr?: () => void;
  onReview?: () => void;
}) {
  return render(
    <ContentProvider content={content}>
      <StatusScreen
        step={step}
        phoneConnected={phoneConnected}
        onShowQr={onShowQr}
        onReview={onReview}
      />
    </ContentProvider>,
  );
}

function liveText() {
  return screen.getByRole("status").textContent ?? "";
}

function statusBody(step: string, phoneConnected: boolean) {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        step,
        phoneConnected,
        lastSeen: "2026-11-18T12:00:00.000Z",
        checks: [],
        handoffExpired: false,
      }),
  });
}
