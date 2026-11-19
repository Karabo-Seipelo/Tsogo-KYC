import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
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

test("the document type heading takes focus after continuing on this computer", async () => {
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

  await user.click(screen.getByRole("button", { name: content.start.cta }));
  await user.click(
    screen.getByRole("radio", {
      name: new RegExp(content.device.options.thisDevice.title),
    }),
  );
  await user.click(
    screen.getByRole("button", { name: content.common.actions.continue }),
  );

  expect(
    screen.getByRole("heading", { name: content.document.select.title }),
  ).toBe(document.activeElement);
});

const documentPhoto = "data:image/jpeg;base64,document-thumb";
const selfiePhoto = "data:image/jpeg;base64,selfie-thumb";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("AC-05.8 desktop review after a phone capture shows the stored thumbnails", async () => {
  const user = userEvent.setup();
  stubJourney(selfiePhoto);

  render(
    <ContentProvider content={content}>
      <Journey />
    </ContentProvider>,
  );

  await user.click(screen.getByRole("button", { name: content.start.cta }));
  await user.click(
    screen.getByRole("button", { name: content.common.actions.continue }),
  );

  expect(
    await screen.findByRole("heading", { name: content.review.title }),
  ).toBeDefined();
  expect(
    screen.getByRole("img", { name: content.faceMatch.documentPhoto }),
  ).toHaveProperty("src", documentPhoto);
  expect(
    screen.getByRole("img", { name: content.faceMatch.selfie }),
  ).toHaveProperty("src", selfiePhoto);
});

test("AC-05.8 a missing stored thumbnail is not shown as a placeholder", async () => {
  const user = userEvent.setup();
  stubJourney(null);

  render(
    <ContentProvider content={content}>
      <Journey />
    </ContentProvider>,
  );

  await user.click(screen.getByRole("button", { name: content.start.cta }));
  await user.click(
    screen.getByRole("button", { name: content.common.actions.continue }),
  );

  expect(
    await screen.findByRole("heading", { name: content.review.title }),
  ).toBeDefined();
  expect(
    screen.getByRole("img", { name: content.faceMatch.documentPhoto }),
  ).toHaveProperty("src", documentPhoto);
  expect(
    screen.queryByRole("img", { name: content.faceMatch.selfie }),
  ).toBeNull();
});

function stubJourney(selfie: string | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/session/thumbnails")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ document: documentPhoto, selfie }),
        });
      }
      if (url.includes("/api/session/status")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ step: "review" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            handoffToken: "token",
            handoffExpiresAt: "2026-01-01T00:10:00.000Z",
          }),
      });
    }),
  );
}
