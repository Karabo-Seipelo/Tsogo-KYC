import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { createT } from "../../lib/content/t";
import { HandoffScreen, handoffWindowMinutes } from "./QrExpired";

const content = contentSchema.parse(bundled);
const t = createT(content);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("AC-02.6 an expired code shows D3b and a new code restores the QR on the same step", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-18T12:00:00.000Z"));
  const onContinueHere = vi.fn();
  const onIssued = vi.fn();
  const sessionId = "session-must-stay-out";
  const nextExpiresAt = "2026-11-18T12:20:00.000Z";

  render(
    <ContentProvider content={content}>
      <HandoffScreen
        token="old-token"
        expiresAt="2026-11-18T12:10:00.000Z"
        host="preview.example"
        onContinueHere={onContinueHere}
        onIssued={onIssued}
        onReview={vi.fn()}
      />
    </ContentProvider>,
  );

  expect(screen.getByText("https://preview.example/m/old-token")).toBeDefined();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(handoffWindowMinutes * 60 * 1000 - 1);
  });
  expect(screen.getByText("https://preview.example/m/old-token")).toBeDefined();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });

  const heading = screen.getByRole("heading", {
    level: 1,
    name: content.handoff.expired.title,
  });
  expect(heading).toBe(document.activeElement);
  expect(
    screen.getByText(
      t("handoff.expired.body", { minutes: handoffWindowMinutes }),
    ),
  ).toBeDefined();
  expect(screen.queryByText("https://preview.example/m/old-token")).toBeNull();

  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            handoffToken: "new-token",
            handoffExpiresAt: nextExpiresAt,
            sessionId,
          }),
      }),
    ),
  );

  act(() => {
    screen.getByRole("button", { name: content.handoff.expired.cta }).click();
  });
  await act(async () => {
    await Promise.resolve();
  });

  expect(fetch).toHaveBeenCalledWith("/api/session/handoff", {
    method: "POST",
  });
  expect(screen.getByText("https://preview.example/m/new-token")).toBeDefined();
  expect(
    screen.getByRole("heading", { level: 1, name: content.handoff.title }),
  ).toBeDefined();
  expect(document.body.textContent).not.toContain(sessionId);
  expect(onIssued).toHaveBeenCalledWith({
    token: "new-token",
    expiresAt: nextExpiresAt,
  });
  expect(onContinueHere).not.toHaveBeenCalled();
});
