import { afterEach, expect, test, vi } from "vitest";
import {
  createRedisStore,
  createSessionStore,
  sessionKeyPrefix,
  type RedisCommands,
} from "./redisStore";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("AC-07.4 a preview session key is prefixed with preview", () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  expect(sessionKeyPrefix()).toBe("preview");
});

test("AC-07.4 a production session key is prefixed with production", () => {
  vi.stubEnv("VERCEL_ENV", "production");
  expect(sessionKeyPrefix()).toBe("production");
});

test("a local session key is prefixed with development", () => {
  vi.stubEnv("VERCEL_ENV", undefined);
  expect(sessionKeyPrefix()).toBe("development");
});

test("set stores the value under the environment prefix with the ttl", async () => {
  const redis = fakeRedis();
  const store = createRedisStore(redis, "preview");

  await store.set("session:1", { step: "idle" }, 60);

  expect(redis.set).toHaveBeenCalledWith(
    "preview:session:1",
    { step: "idle" },
    {
      ex: 60,
    },
  );
});

test("get reads the prefixed key and returns null when it is missing", async () => {
  const redis = fakeRedis();
  redis.get.mockResolvedValueOnce({ step: "idle" });
  const store = createRedisStore(redis, "preview");

  await expect(store.get("session:1")).resolves.toEqual({ step: "idle" });
  expect(redis.get).toHaveBeenCalledWith("preview:session:1");

  redis.get.mockResolvedValueOnce(null);
  await expect(store.get("session:1")).resolves.toBeNull();
});

test("getDel reads and deletes the prefixed key once", async () => {
  const redis = fakeRedis();
  redis.getdel.mockResolvedValueOnce({ sessionId: "s" });
  const store = createRedisStore(redis, "preview");

  await expect(store.getDel("handoff:token")).resolves.toEqual({
    sessionId: "s",
  });
  expect(redis.getdel).toHaveBeenCalledWith("preview:handoff:token");

  redis.getdel.mockResolvedValueOnce(null);
  await expect(store.getDel("handoff:token")).resolves.toBeNull();
});

test("an unset STORE_DRIVER keeps the shared memory store", async () => {
  vi.stubEnv("STORE_DRIVER", undefined);
  const first = createSessionStore();
  await first.set("session:1", { step: "idle" }, 60);

  await expect(createSessionStore().get("session:1")).resolves.toEqual({
    step: "idle",
  });
});

test("AC-07.4 STORE_DRIVER redis writes to the preview-prefixed database", async () => {
  vi.stubEnv("STORE_DRIVER", "redis");
  vi.stubEnv("VERCEL_ENV", "preview");
  const redis = fakeRedis();
  const store = createSessionStore({ redis });

  await store.set("session:1", { step: "qrHandoff" }, 600);

  expect(redis.set).toHaveBeenCalledWith(
    "preview:session:1",
    { step: "qrHandoff" },
    { ex: 600 },
  );
});

test("expire sets the ttl on the prefixed key", async () => {
  const redis = fakeRedis();
  const store = createRedisStore(redis, "production");

  await store.expire("session:1", 90);

  expect(redis.expire).toHaveBeenCalledWith("production:session:1", 90);
});

function fakeRedis(): RedisCommands & {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  getdel: ReturnType<typeof vi.fn>;
  expire: ReturnType<typeof vi.fn>;
} {
  return {
    get: vi.fn(),
    set: vi.fn(),
    getdel: vi.fn(),
    expire: vi.fn(),
  };
}
