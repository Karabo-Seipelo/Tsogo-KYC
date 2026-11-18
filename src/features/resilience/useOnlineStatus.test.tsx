import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { OfflineBanner } from "./OfflineBanner";
import { useOnlineStatus } from "./useOnlineStatus";

const content = contentSchema.parse(bundled);

afterEach(() => {
  setOnline(true);
  vi.unstubAllGlobals();
});

test("R-06.1 the hook follows the browser online and offline events", () => {
  setOnline(true);
  const { result } = renderHook(() => useOnlineStatus());

  expect(result.current).toBe(true);

  act(() => {
    window.dispatchEvent(new Event("offline"));
  });
  expect(result.current).toBe(false);

  act(() => {
    window.dispatchEvent(new Event("online"));
  });
  expect(result.current).toBe(true);
});

test("R-06.1 a failed fetch reports offline and still rejects", async () => {
  setOnline(true);
  const networkError = new TypeError("Failed to fetch");
  const inner = vi.fn(() => Promise.reject(networkError));
  vi.stubGlobal("fetch", inner);
  const { result } = renderHook(() => useOnlineStatus());

  await expect(fetch("/api/session/document", { method: "POST" })).rejects.toBe(
    networkError,
  );
  expect(inner).toHaveBeenCalledOnce();
  expect(result.current).toBe(false);
});

test("R-06.1 an HTTP error response stays online", async () => {
  setOnline(true);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: false, status: 503 })),
  );
  const { result } = renderHook(() => useOnlineStatus());

  await fetch("/api/session/document", { method: "POST" });

  expect(result.current).toBe(true);
});

test("AC-06.1 going offline shows the banner and leaves Take photo usable", () => {
  setOnline(true);
  const onTakePhoto = vi.fn();
  render(
    <ContentProvider content={content}>
      <OfflineBanner />
      <button type="button" onClick={onTakePhoto}>
        Take photo
      </button>
    </ContentProvider>,
  );

  expect(screen.queryByRole("status")).toBeNull();

  act(() => {
    window.dispatchEvent(new Event("offline"));
  });

  expect(screen.getByRole("status").textContent).toBe(
    content.errors.OFFLINE.banner,
  );
  screen.getByRole("button", { name: "Take photo" }).click();
  expect(onTakePhoto).toHaveBeenCalledOnce();
});

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}
