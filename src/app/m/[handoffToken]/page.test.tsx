import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../../content/en-ZA.json";
import { contentSchema } from "../../../lib/content/schema";
import PhonePage from "../page";
import Page from "./page";

const handoffToken = { current: "fresh-token" };

vi.mock("next/navigation", () => ({
  useParams: () => ({ handoffToken: handoffToken.current }),
}));

const content = contentSchema.parse(bundled);

afterEach(() => {
  vi.unstubAllGlobals();
});

test("AC-02.4 opening a valid link redeems it and the address becomes /m", async () => {
  handoffToken.current = "fresh-token";
  const replace = vi.fn();
  const sessionId = "session-must-stay-out";
  vi.stubGlobal("location", { replace });
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ status: 0, type: "opaqueredirect" })),
  );

  render(<Page />);

  await waitFor(() => {
    expect(replace).toHaveBeenCalledWith("/m");
  });
  expect(fetch).toHaveBeenCalledWith("/api/handoff/fresh-token", {
    method: "POST",
    redirect: "manual",
  });
  expect(String(replace.mock.calls[0]?.[0])).not.toContain(sessionId);
  expect(
    screen.queryByRole("heading", { name: content.errors.HANDOFF_USED.title }),
  ).toBeNull();
});

test("AC-02.5 opening a used link shows that the link has already been used", async () => {
  handoffToken.current = "used-token";
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ status: 410, type: "basic" })),
  );

  render(<Page />);

  const heading = await screen.findByRole("heading", {
    level: 1,
    name: content.errors.HANDOFF_USED.title,
  });
  expect(heading).toBe(document.activeElement);
  expect(screen.getByText(content.errors.HANDOFF_USED.body)).toBeDefined();
});

test("R-02.2 the phone journey starts without the device choice", async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  render(<PhonePage />);
  await user.click(screen.getByRole("button", { name: content.start.cta }));

  expect(fetchMock).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("heading", { name: content.device.title }),
  ).toBeNull();
  expect(
    screen.getByRole("heading", { name: content.document.select.title }),
  ).toBeDefined();
});
