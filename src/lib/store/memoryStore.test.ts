import { afterEach, expect, test, vi } from "vitest";
import { createMemoryStore } from "./memoryStore";

afterEach(() => {
  vi.useRealTimers();
});

test("a value set in one memory store is readable from the next", async () => {
  const first = createMemoryStore();
  await first.set("session:1", { step: "idle" }, 60);

  const second = createMemoryStore();

  await expect(second.get("session:1")).resolves.toEqual({ step: "idle" });
});

test("get of a missing key is null", async () => {
  const store = createMemoryStore();

  await expect(store.get("session:missing")).resolves.toBeNull();
});

test("getDel returns the value once", async () => {
  const store = createMemoryStore();
  await store.set("handoff:token", { sessionId: "s" }, 60);

  await expect(store.getDel("handoff:token")).resolves.toEqual({
    sessionId: "s",
  });
  await expect(store.get("handoff:token")).resolves.toBeNull();
});

test("getDel of a missing key is null", async () => {
  const store = createMemoryStore();

  await expect(store.getDel("handoff:missing")).resolves.toBeNull();
});

test("a key is gone after its ttl", async () => {
  vi.useFakeTimers();
  const store = createMemoryStore();
  await store.set("session:1", { step: "idle" }, 15 * 60);

  vi.advanceTimersByTime(15 * 60 * 1000);

  await expect(store.get("session:1")).resolves.toBeNull();
});

test("expire replaces the remaining ttl", async () => {
  vi.useFakeTimers();
  const store = createMemoryStore();
  await store.set("session:1", { step: "idle" }, 15 * 60);

  await store.expire("session:1", 1);
  vi.advanceTimersByTime(1000);

  await expect(store.get("session:1")).resolves.toBeNull();
});
