import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useCamera } from "./useCamera";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("R-03.2 start asks for the rear camera and keeps the stream", async () => {
  const { stream, tracks } = fakeStream();
  const getUserMedia = installCamera(async () => stream);
  const { result } = renderHook(() => useCamera());

  await act(async () => {
    await result.current.start();
  });

  expect(getUserMedia).toHaveBeenCalledWith({
    video: { facingMode: "environment" },
  });
  expect(result.current.stream).toBe(stream);
  expect(result.current.error).toBeNull();
  expect(tracks[0]?.stop).not.toHaveBeenCalled();
});

test("start reuses a live stream instead of asking again", async () => {
  const { stream, tracks } = fakeStream("live");
  const getUserMedia = installCamera(async () => stream);
  const { result } = renderHook(() => useCamera());

  await act(async () => {
    await result.current.start("user");
  });
  await act(async () => {
    await result.current.start("user");
  });

  expect(getUserMedia).toHaveBeenCalledOnce();
  expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: "user" } });
  expect(result.current.stream).toBe(stream);
  expect(tracks[0]?.stop).not.toHaveBeenCalled();
});

test("stop ends every track and drops the stream", async () => {
  const { stream, tracks } = fakeStream();
  installCamera(async () => stream);
  const { result } = renderHook(() => useCamera());

  await act(async () => {
    await result.current.start();
  });
  act(() => {
    result.current.stop();
  });

  expect(tracks[0]?.stop).toHaveBeenCalledOnce();
  expect(tracks[1]?.stop).toHaveBeenCalledOnce();
  expect(result.current.stream).toBeNull();
});

test("unmount stops the open camera", async () => {
  const { stream, tracks } = fakeStream();
  installCamera(async () => stream);
  const { result, unmount } = renderHook(() => useCamera());

  await act(async () => {
    await result.current.start();
  });
  unmount();

  expect(tracks[0]?.stop).toHaveBeenCalledOnce();
});

test.each(["NotAllowedError", "NotFoundError", "NotReadableError"] as const)(
  "start maps %s and does not keep a stream",
  async (name) => {
    installCamera(async () => {
      throw new DOMException(name, name);
    });
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.error).toBe(name);
    expect(result.current.stream).toBeNull();
  },
);

function installCamera(getUserMedia: () => Promise<MediaStream>) {
  const request = vi.fn(getUserMedia);
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: request } });
  return request;
}

function fakeStream(readyState?: MediaStreamTrack["readyState"]) {
  const tracks = [
    { stop: vi.fn(), readyState },
    { stop: vi.fn(), readyState },
  ];
  const stream = { getTracks: () => tracks } as unknown as MediaStream;
  return { stream, tracks };
}
