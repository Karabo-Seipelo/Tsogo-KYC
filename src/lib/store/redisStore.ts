import { Redis } from "@upstash/redis";
import { createMemoryStore } from "./memoryStore";
import type { SessionStore } from "./sessionStore";

// SET ex, GET, GETDEL and EXPIRE.
// Source: https://upstash.com/docs/redis/sdks/ts/commands/string/set
// The command fields stay wide so the approved tests can pass vi.fn().
// Calls below go through RedisClient, which is the real Upstash shape.
export type RedisCommands = {
  get: object;
  set: object;
  getdel: object;
  expire: object;
};

type RedisClient = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, options: { ex: number }): Promise<unknown>;
  getdel(key: string): Promise<unknown>;
  expire(key: string, seconds: number): Promise<unknown>;
};

type SessionStoreOptions = {
  redis?: RedisCommands;
};

export function sessionKeyPrefix(env = process.env.VERCEL_ENV) {
  if (env === "preview" || env === "production") {
    return env;
  }
  return "development";
}

export function createRedisStore(
  redis: RedisCommands,
  prefix: string,
): SessionStore {
  const client = redis as RedisClient;

  function key(name: string) {
    return `${prefix}:${name}`;
  }

  return {
    async get(name) {
      return (await client.get(key(name))) ?? null;
    },
    async set(name, value, ttlSeconds) {
      await client.set(key(name), value, { ex: ttlSeconds });
    },
    async getDel(name) {
      return (await client.getdel(key(name))) ?? null;
    },
    async expire(name, ttlSeconds) {
      await client.expire(key(name), ttlSeconds);
    },
  };
}

export function createSessionStore(options: SessionStoreOptions = {}) {
  if (process.env.STORE_DRIVER === "redis") {
    return createRedisStore(
      options.redis ?? upstashCommands(),
      sessionKeyPrefix(),
    );
  }
  return createMemoryStore();
}

function upstashCommands(): RedisCommands {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required when STORE_DRIVER=redis",
    );
  }
  const redis = new Redis({ url, token });
  return {
    get: (key: string) => redis.get(key),
    set: (key: string, value: unknown, options: { ex: number }) =>
      redis.set(key, value, options),
    getdel: (key: string) => redis.getdel(key),
    expire: (key: string, seconds: number) => redis.expire(key, seconds),
  } as RedisCommands;
}
