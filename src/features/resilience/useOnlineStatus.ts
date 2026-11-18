"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (!navigator.onLine) {
      queueMicrotask(() => setOnline(false));
    }

    function goOffline() {
      setOnline(false);
    }
    function goOnline() {
      setOnline(true);
    }
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    const previous = globalThis.fetch.bind(globalThis);
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        return await previous(input, init);
      } catch (error) {
        flushSync(() => setOnline(false));
        throw error;
      }
    };

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      globalThis.fetch = previous;
    };
  }, []);

  return online;
}
