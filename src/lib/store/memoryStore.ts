import type { SessionStore } from "./sessionStore";

type Entry = {
  value: unknown;
  expiresAt: number;
};

const storeKey = "__tsogoKycMemoryStore";

type StoreGlobal = typeof globalThis & {
  [storeKey]?: Map<string, Entry>;
};

export function createMemoryStore(): SessionStore {
  const entries = sharedEntries();
  return {
    async get(key) {
      return read(entries, key);
    },
    async set(key, value, ttlSeconds) {
      entries.set(key, { value, expiresAt: expiresAt(ttlSeconds) });
    },
    async getDel(key) {
      const value = read(entries, key);
      entries.delete(key);
      return value;
    },
    async expire(key, ttlSeconds) {
      const entry = entries.get(key);
      if (!entry || isExpired(entry)) {
        entries.delete(key);
        return;
      }
      entry.expiresAt = expiresAt(ttlSeconds);
    },
  };
}

function sharedEntries() {
  const root = globalThis as StoreGlobal;
  root[storeKey] ??= new Map();
  return root[storeKey];
}

function read(entries: Map<string, Entry>, key: string) {
  const entry = entries.get(key);
  if (!entry || isExpired(entry)) {
    entries.delete(key);
    return null;
  }
  return entry.value;
}

function isExpired(entry: Entry) {
  return Date.now() >= entry.expiresAt;
}

function expiresAt(ttlSeconds: number) {
  return Date.now() + ttlSeconds * 1000;
}
