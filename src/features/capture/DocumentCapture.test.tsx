import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { DocumentCapture } from "./DocumentCapture";

const content = contentSchema.parse(bundled);

afterEach(() => {
  vi.unstubAllGlobals();
});

test("AC-03.2 the live preview sits inside the outline and Take photo is a button", async () => {
  const stream = fakeCamera();
  renderCapture({ side: 1, total: 1, checking: false });

  const preview = await screen.findByLabelText(
    content.document.capture.cameraAlt,
  );
  expect(preview.tagName).toBe("VIDEO");
  expect(preview.parentElement?.className).toContain("border");
  await waitFor(() => {
    expect(preview).toHaveProperty("srcObject", stream);
  });
  expect(
    screen.getByRole("button", { name: content.document.capture.takePhoto })
      .tagName,
  ).toBe("BUTTON");
  expect(
    screen.getByText(content.document.capture.uploadInstead),
  ).toBeDefined();
});

test("AC-03.3 the back of a two-sided document is labelled Side 2 of 2", () => {
  fakeCamera();
  renderCapture({ side: 2, total: 2, checking: false });

  expect(screen.getByText("Side 2 of 2")).toBeDefined();
});

test("AC-03.4 checking shows while the upload is in progress", () => {
  fakeCamera();
  renderCapture({ side: 1, total: 1, checking: true });

  expect(screen.getByRole("status").textContent).toBe(
    content.document.checking,
  );
  expect(
    screen.getByText(content.document.capture.uploadInstead),
  ).toBeDefined();
});

test("AC-03.7 a denied camera shows the steps and the upload fallback", async () => {
  denyCamera("NotAllowedError");
  renderCapture({ side: 1, total: 1, checking: false });

  const heading = await screen.findByRole("heading", {
    name: content.errors.CAMERA_DENIED.title,
  });
  expect(heading).toBe(document.activeElement);
  for (const step of content.errors.CAMERA_DENIED.steps) {
    expect(screen.getByText(step)).toBeDefined();
  }
  expect(screen.getByText(content.errors.CAMERA_DENIED.fallback)).toBeDefined();
});

test("AC-03.7 a missing camera offers an upload", async () => {
  denyCamera("NotFoundError");
  renderCapture({ side: 1, total: 1, checking: false });

  expect(
    await screen.findByRole("heading", {
      name: content.errors.CAMERA_NOT_FOUND.title,
    }),
  ).toBeDefined();
  expect(screen.getByText(content.errors.CAMERA_NOT_FOUND.cta)).toBeDefined();
});

function renderCapture(props: {
  side: number;
  total: number;
  checking: boolean;
}) {
  render(
    <ContentProvider content={content}>
      <DocumentCapture {...props} onCapture={() => undefined} />
    </ContentProvider>,
  );
}

function denyCamera(name: string) {
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: vi.fn(async () => {
        throw new DOMException("camera", name);
      }),
    },
  });
}

function fakeCamera() {
  Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
    configurable: true,
    writable: true,
    value: null,
  });
  const stream = { getTracks: () => [{ stop: vi.fn() }] };
  vi.stubGlobal("navigator", {
    mediaDevices: { getUserMedia: vi.fn(async () => stream) },
  });
  return stream;
}
