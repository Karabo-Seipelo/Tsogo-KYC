import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { createT } from "../../lib/content/t";
import { livenessPromptMs } from "./LivenessCheck";
import { SelfieJourney } from "./SelfieJourney";

const content = contentSchema.parse(bundled);
const t = createT(content);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("a passing selfie sends SELFIE_CAPTURED, LIVENESS_PASSED, and Continue sends MATCHED", async () => {
  const send = vi.fn();
  const face = deferredResponse({ match: true, confidence: 0.99 });
  installJourney(face.promise);
  renderJourney(send);

  await act(async () => {
    screen.getByRole("button", { name: content.selfie.cta }).click();
    await flush();
  });
  await act(async () => {
    await flush();
  });

  expect(send).toHaveBeenCalledWith({ type: "SELFIE_CAPTURED" });
  expect(screen.getByText(progress(1))).toBeDefined();

  await passLiveness();

  expect(send).toHaveBeenCalledWith({ type: "LIVENESS_PASSED" });
  expect(screen.getByRole("status").textContent).toBe(
    content.faceMatch.comparing,
  );
  expect(send).not.toHaveBeenCalledWith({ type: "MATCHED" });

  await act(async () => {
    face.resolve(json({ match: true, confidence: 0.99 }));
    await flush();
  });

  expect(
    screen.getByRole("heading", { name: content.faceMatch.matched.title }),
  ).toBeDefined();
  act(() => {
    screen
      .getByRole("button", { name: content.common.actions.continue })
      .click();
  });
  expect(send).toHaveBeenCalledWith({ type: "MATCHED" });
});

test("a failed face match sends NO_MATCH and returns to the selfie", async () => {
  const send = vi.fn();
  installJourney(Promise.resolve(json({ match: false, confidence: 0.99 })));
  renderJourney(send);

  await act(async () => {
    screen.getByRole("button", { name: content.selfie.cta }).click();
    await flush();
  });
  await passLiveness();

  expect(send).toHaveBeenCalledWith({ type: "NO_MATCH" });
  expect(send).not.toHaveBeenCalledWith({ type: "MATCHED" });
  expect(
    screen.getByRole("button", { name: content.selfie.cta }),
  ).toBeDefined();
});

function renderJourney(send: (event: { type: string }) => void) {
  render(
    <ContentProvider content={content}>
      <SelfieJourney send={send} />
    </ContentProvider>,
  );
}

function installJourney(faceMatch: Promise<Response>) {
  vi.useFakeTimers();
  Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
    configurable: true,
    writable: true,
    value: null,
  });
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: vi.fn() }],
      })),
    },
  });
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ width: 800, height: 800, close: vi.fn() })),
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
      value: (callback: BlobCallback, type: string) => {
        callback(new Blob(["resized-jpeg"], { type }));
      },
    });
    return canvas;
  });
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.endsWith("/liveness")) {
        return Promise.resolve(json({ passed: true }));
      }
      if (url.endsWith("/face-match")) {
        return faceMatch;
      }
      return Promise.resolve(json({ ok: true }));
    }),
  );
}

function progress(current: number) {
  return t("liveness.progress", { current, total: 3 });
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

async function passLiveness() {
  for (let step = 0; step < 3; step += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(livenessPromptMs);
      await flush();
    });
  }
}

async function flush() {
  for (let step = 0; step < 20; step += 1) {
    await Promise.resolve();
  }
}
