"use client";

import { useEffect, useRef, useState } from "react";

const cameraErrors = [
  "NotAllowedError",
  "NotFoundError",
  "NotReadableError",
] as const;

type CameraError = (typeof cameraErrors)[number];

export function useCamera() {
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<CameraError | null>(null);

  useEffect(() => {
    return () => {
      stopTracks(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  async function start() {
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stopTracks(streamRef.current);
      streamRef.current = next;
      setStream(next);
      setError(null);
    } catch (caught) {
      stopTracks(streamRef.current);
      streamRef.current = null;
      setStream(null);
      setError(toCameraError(caught));
    }
  }

  function stop() {
    stopTracks(streamRef.current);
    streamRef.current = null;
    setStream(null);
  }

  return { start, stop, stream, error };
}

function stopTracks(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) {
    track.stop();
  }
}

function toCameraError(caught: unknown): CameraError | null {
  if (!(caught instanceof DOMException)) {
    return null;
  }
  return cameraErrors.find((name) => name === caught.name) ?? null;
}
