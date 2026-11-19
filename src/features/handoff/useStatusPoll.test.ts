import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { statusPollMs, useStatusPoll } from "./useStatusPoll";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
});

test("R-02.6 AC-02.4 the desktop polls every 2.5 seconds, pauses while hidden, and reports the server step", async () => {
  expect(statusPollMs).toBe(2_500);
  vi.useFakeTimers();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonStatus(false, "qrHandoff"))
    .mockResolvedValue(jsonStatus(true, "documentUpload"));
  vi.stubGlobal("fetch", fetchMock);

  const { result } = renderHook(() => useStatusPoll());

  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith("/api/session/status");
  expect(result.current).toMatchObject({
    step: "qrHandoff",
    phoneConnected: false,
  });

  await act(async () => {
    await vi.advanceTimersByTimeAsync(statusPollMs - 1);
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(result.current).toMatchObject({
    step: "documentUpload",
    phoneConnected: true,
  });

  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(statusPollMs);
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);

  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  document.dispatchEvent(new Event("visibilitychange"));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

test("AC-06.6 a 401 after a session existed marks the status expired", async () => {
  vi.useFakeTimers();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonStatus(false, "documentUpload"))
    .mockResolvedValue(new Response(null, { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);

  const { result } = renderHook(() => useStatusPoll());

  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(result.current).toMatchObject({
    step: "documentUpload",
    expired: false,
  });

  await act(async () => {
    await vi.advanceTimersByTimeAsync(statusPollMs);
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(result.current).toMatchObject({ expired: true });
});

function jsonStatus(phoneConnected: boolean, step: string) {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        step,
        phoneConnected,
        lastSeen: phoneConnected ? "2026-11-18T12:00:00.000Z" : null,
        checks: [],
        handoffExpired: false,
      }),
  });
}
