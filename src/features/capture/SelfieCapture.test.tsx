import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { SelfieCapture } from "./SelfieCapture";

const content = contentSchema.parse(bundled);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("AC-04.1 the front camera is mirrored inside an oval guide", async () => {
  const getUserMedia = fakeCamera();
  renderSelfie();

  const preview = await screen.findByLabelText(content.selfie.cameraAlt);
  expect(preview.tagName).toBe("VIDEO");
  expect(preview.className).toContain("-scale-x-100");
  expect(preview.parentElement?.innerHTML).toContain("rounded-[50%]");
  expect(screen.getByText(content.selfie.instruction)).toBeDefined();
  await waitFor(() => {
    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "user" },
    });
  });
});

test("AC-04.2 taking a selfie resizes it and shows a loading state while it uploads", async () => {
  const user = userEvent.setup();
  const onDone = vi.fn();
  const drawn = stubImage(3200, 1600);
  fakeCamera();
  const upload = deferredResponse({ ok: true });
  vi.stubGlobal(
    "fetch",
    vi.fn(() => upload.promise),
  );
  renderSelfie(onDone);

  await user.click(screen.getByRole("button", { name: content.selfie.cta }));

  expect((await screen.findByRole("status")).getAttribute("aria-busy")).toBe(
    "true",
  );
  expect(screen.queryByRole("button", { name: content.selfie.cta })).toBeNull();
  await waitFor(() => {
    expect(drawn).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 1600, quality: 0.8 }),
        expect.objectContaining({ width: 320, quality: 0.7 }),
      ]),
    );
  });

  upload.resolve(json({ ok: true }));
  await waitFor(() => {
    expect(onDone).toHaveBeenCalledOnce();
  });
  const thumbnail = onDone.mock.calls[0]?.[0] as Blob;
  expect(await thumbnail.text()).toBe("resized-jpeg");
});

test("AC-04.8 a denied front camera shows the camera steps and an upload", async () => {
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: vi.fn(async () => {
        throw new DOMException("denied", "NotAllowedError");
      }),
    },
  });
  renderSelfie();

  const heading = await screen.findByRole("heading", {
    name: content.errors.CAMERA_DENIED.title,
  });
  expect(heading).toBe(document.activeElement);
  for (const step of content.errors.CAMERA_DENIED.steps) {
    expect(screen.getByText(step)).toBeDefined();
  }
  expect(screen.getByText(content.errors.CAMERA_DENIED.fallback)).toBeDefined();
  expect(screen.queryByText(content.selfie.instruction)).toBeNull();
});

function renderSelfie(onDone: (thumbnail: Blob) => void = () => undefined) {
  render(
    <ContentProvider content={content}>
      <SelfieCapture onDone={onDone} />
    </ContentProvider>,
  );
}

function fakeCamera() {
  Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
    configurable: true,
    writable: true,
    value: null,
  });
  const request = vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] }));
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: request } });
  return request;
}

function stubImage(width: number, height: number) {
  const drawn: { width: number; quality: number }[] = [];
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ width, height, close: vi.fn() })),
  );
  const original = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    if (tagName !== "canvas") {
      return original(tagName);
    }
    const canvas = original("canvas");
    Object.defineProperty(canvas, "getContext", {
      value: () => ({ drawImage: vi.fn() }),
    });
    Object.defineProperty(canvas, "toBlob", {
      value: (callback: BlobCallback, type: string, quality: number) => {
        drawn.push({ width: canvas.width, quality });
        callback(new Blob(["resized-jpeg"], { type }));
      },
    });
    return canvas;
  });
  return drawn;
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function deferredResponse(body: unknown) {
  let resolve: (response: Response) => void = () => undefined;
  const promise = new Promise<Response>((done) => {
    resolve = done;
  });
  return {
    promise,
    resolve: (response: Response = json(body)) => resolve(response),
  };
}
