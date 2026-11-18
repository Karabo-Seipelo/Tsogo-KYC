import { afterEach, expect, test, vi } from "vitest";
import { resizeImage } from "./resizeImage";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("R-03.4 a wide photo becomes a 1600 px JPEG without the original bytes", async () => {
  const source = new Blob(["full-size-photo"], { type: "image/png" });
  const drawn = stubImage(3200, 1600);

  const result = await resizeImage(source, 1600, 0.8);

  expect(drawn).toEqual({
    width: 1600,
    height: 800,
    type: "image/jpeg",
    quality: 0.8,
  });
  expect(result).not.toBe(source);
  expect(result.type).toBe("image/jpeg");
  expect(await result.text()).toBe("resized-jpeg");
});

test("R-03.4 a tall photo becomes a 320 px thumbnail", async () => {
  const drawn = stubImage(1000, 2000);

  await resizeImage(new Blob(["full-size-photo"]), 320, 0.7);

  expect(drawn).toEqual({
    width: 160,
    height: 320,
    type: "image/jpeg",
    quality: 0.7,
  });
});

test("R-03.4 a photo already under the limit is not enlarged", async () => {
  const drawn = stubImage(800, 600);

  await resizeImage(new Blob(["small-photo"]), 1600, 0.8);

  expect(drawn).toMatchObject({ width: 800, height: 600 });
});

function stubImage(width: number, height: number) {
  const drawn = { width: 0, height: 0, type: "", quality: 0 };
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ width, height, close: vi.fn() })),
  );
  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    const element = document.createElementNS(
      "http://www.w3.org/1999/xhtml",
      tagName,
    );
    if (tagName !== "canvas") {
      return element;
    }
    const canvas = element as HTMLCanvasElement;
    Object.defineProperty(canvas, "getContext", {
      value: () => ({ drawImage: vi.fn() }),
    });
    Object.defineProperty(canvas, "toBlob", {
      value: (callback: BlobCallback, type: string, quality: number) => {
        drawn.width = canvas.width;
        drawn.height = canvas.height;
        drawn.type = type;
        drawn.quality = quality;
        callback(new Blob(["resized-jpeg"], { type }));
      },
    });
    return canvas;
  });
  return drawn;
}
