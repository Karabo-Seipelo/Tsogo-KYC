import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { DocumentJourney } from "./DocumentJourney";

const content = contentSchema.parse(bundled);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("R-03.6 a passing photo sends DOC_CAPTURED and Continue sends DOC_VALID", async () => {
  const user = userEvent.setup();
  const send = vi.fn();
  const result = deferredResponse({ passed: true, checks: [] });
  stubFetch(result.promise);
  renderJourney(send);

  await user.click(radio(content.document.select.options.passport.title));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(
    screen.getByRole("button", { name: content.document.capture.takePhoto }),
  );

  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    content.document.checking,
  );
  result.resolve(json({ passed: true, checks: [] }));

  expect(
    await screen.findByRole("heading", {
      name: content.document.result.passed.title,
    }),
  ).toBeDefined();
  expect(send).toHaveBeenCalledWith({ type: "DOC_CAPTURED" });

  await user.click(
    screen.getByRole("button", { name: content.common.actions.continue }),
  );
  expect(send).toHaveBeenCalledWith({ type: "DOC_VALID" });
});

test("R-03.6 a failed check sends DOC_INVALID", async () => {
  const user = userEvent.setup();
  const send = vi.fn();
  stubFetch(Promise.resolve(json({ passed: false, checks: [] })));
  renderJourney(send);

  await user.click(radio(content.document.select.options.passport.title));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(
    screen.getByRole("button", { name: content.document.capture.takePhoto }),
  );

  const heading = await screen.findByRole("heading", {
    name: content.document.result.failed.title,
  });
  expect(heading).toBe(document.activeElement);
  expect(
    screen.getByText(content.document.result.failed.reasons.blurry.intro),
  ).toBeDefined();
  expect(screen.getByText("Attempt 1 of 3")).toBeDefined();
  expect(send).toHaveBeenCalledWith({ type: "DOC_CAPTURED" });
  expect(send).toHaveBeenCalledWith({ type: "DOC_INVALID" });
});

test("R-03.6 an upload that does not complete sends UPLOAD_FAILED", async () => {
  const user = userEvent.setup();
  const send = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline"))),
  );
  renderJourney(send);

  await user.click(radio(content.document.select.options.passport.title));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(
    screen.getByRole("button", { name: content.document.capture.takePhoto }),
  );

  expect(
    await screen.findByRole("heading", {
      name: content.errors.UPLOAD_FAILED.message,
    }),
  ).toBeDefined();
  expect(send).toHaveBeenCalledWith({ type: "UPLOAD_FAILED" });
  expect(send).not.toHaveBeenCalledWith({ type: "DOC_CAPTURED" });
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
});

test("AC-03.8 Try again sends the saved photo after the automatic retries", async () => {
  const user = userEvent.setup();
  const bodies: FormData[] = [];
  let calls = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init: { body: FormData }) => {
      calls += 1;
      bodies.push(init.body);
      if (calls < 4) {
        return Promise.reject(new Error("offline"));
      }
      return Promise.resolve(json({ passed: true, checks: [] }));
    }),
  );
  renderJourney(vi.fn());

  await user.click(radio(content.document.select.options.passport.title));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(
    screen.getByRole("button", { name: content.document.capture.takePhoto }),
  );
  await user.click(
    await screen.findByRole("button", {
      name: content.errors.UPLOAD_FAILED.cta,
    }),
  );

  expect(
    await screen.findByRole("heading", {
      name: content.document.result.passed.title,
    }),
  ).toBeDefined();
  expect(calls).toBe(4);
  const first = bodies[0]?.get("thumbnail");
  const again = bodies[3]?.get("thumbnail");
  expect(await blobText(first)).toBe(await blobText(again));
});

test("AC-03.10 Take photo sends a JPEG of the video frame, resized for upload", async () => {
  const user = userEvent.setup();
  const bodies: FormData[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init: { body: FormData }) => {
      bodies.push(init.body);
      return Promise.resolve(json({ passed: true, checks: [] }));
    }),
  );
  const drawn = stubCameraFrame();
  renderJourney(vi.fn());

  await user.click(radio(content.document.select.options.passport.title));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  const preview = screen.getByLabelText(content.document.capture.cameraAlt);
  Object.defineProperty(preview, "videoWidth", { value: 1920 });
  Object.defineProperty(preview, "videoHeight", { value: 1080 });
  await user.click(
    screen.getByRole("button", { name: content.document.capture.takePhoto }),
  );

  expect(
    await screen.findByRole("heading", {
      name: content.document.result.passed.title,
    }),
  ).toBeDefined();
  const thumbnail = await blobBytes(bodies[0]?.get("thumbnail"));
  const image = await blobBytes(bodies[0]?.get("image"));
  expect([...thumbnail.slice(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  expect(thumbnail.length).toBeLessThanOrEqual(150 * 1024);
  expect([...image.slice(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  expect(drawn.fromVideo).toBe(true);
  expect(drawn.encodes).toEqual(
    expect.arrayContaining([
      { width: 1600, quality: 0.8 },
      { width: 320, quality: 0.7 },
    ]),
  );
});

test("AC-03.11 a 400 asks for a retake with an upload and does not retry", async () => {
  const user = userEvent.setup();
  const send = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(null, { status: 400 }))),
  );
  renderJourney(send);

  await user.click(radio(content.document.select.options.passport.title));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(
    screen.getByRole("button", { name: content.document.capture.takePhoto }),
  );

  expect(
    await screen.findByRole("button", {
      name: content.common.actions.retakePhoto,
    }),
  ).toBeDefined();
  expect(
    screen.queryByRole("heading", {
      name: content.errors.UPLOAD_FAILED.message,
    }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: content.errors.UPLOAD_FAILED.cta }),
  ).toBeNull();
  expect(
    screen.getByLabelText(content.document.capture.uploadInstead),
  ).toBeDefined();
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  expect(send).not.toHaveBeenCalledWith({ type: "UPLOAD_FAILED" });
});

function renderJourney(send: (event: { type: string }) => void) {
  if (!vi.isMockFunction(globalThis.createImageBitmap)) {
    stubJpegCanvas();
  }
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: vi.fn() }],
      })),
    },
  });
  render(
    <ContentProvider content={content}>
      <DocumentJourney send={send} />
    </ContentProvider>,
  );
}

function stubFetch(response: Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => response),
  );
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

async function blobText(value: FormDataEntryValue | null | undefined) {
  if (value && typeof value !== "string" && "text" in value) {
    return value.text();
  }
  return "";
}

async function blobBytes(value: FormDataEntryValue | null | undefined) {
  if (!value || typeof value === "string" || !("arrayBuffer" in value)) {
    return new Uint8Array();
  }
  return new Uint8Array(await value.arrayBuffer());
}

function stubJpegCanvas() {
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ width: 640, height: 480, close: vi.fn() })),
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
      value: (callback: BlobCallback, type?: string) => {
        callback(new Blob(["jpeg"], { type }));
      },
    });
    return canvas;
  });
}

function stubCameraFrame() {
  const encodes: { width: number; quality: number }[] = [];
  const drawn = { fromVideo: false, encodes };
  const jpeg = new Uint8Array(32);
  jpeg.set([0xff, 0xd8, 0xff]);
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ width: 1920, height: 1080, close: vi.fn() })),
  );
  const original = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    if (tagName !== "canvas") {
      return original(tagName);
    }
    const canvas = original("canvas");
    Object.defineProperty(canvas, "getContext", {
      value: () => ({
        drawImage: (source: CanvasImageSource) => {
          if (source instanceof HTMLVideoElement) {
            drawn.fromVideo = true;
          }
        },
      }),
    });
    Object.defineProperty(canvas, "toBlob", {
      value: (callback: BlobCallback, type: string, quality: number) => {
        encodes.push({ width: canvas.width, quality });
        callback(new Blob([jpeg], { type }));
      },
    });
    return canvas;
  });
  return drawn;
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
