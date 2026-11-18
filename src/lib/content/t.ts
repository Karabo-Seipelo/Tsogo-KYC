import type { Content } from "./schema";

type StringLeaves<T> = T extends string
  ? never
  : T extends readonly unknown[]
    ? never
    : {
        [K in keyof T & string]: T[K] extends string
          ? K
          : T[K] extends readonly unknown[]
            ? never
            : T[K] extends object
              ? `${K}.${StringLeaves<T[K]>}`
              : never;
      }[keyof T & string];

export type ContentKey = StringLeaves<Content>;

const placeholder = /\{([A-Za-z][A-Za-z0-9]*)\}/g;

export function createT(content: Content) {
  return function t(
    key: ContentKey,
    values?: Record<string, string | number>,
  ): string {
    const template = lookup(content, key);
    return template.replace(placeholder, (token, name: string) => {
      const value = values?.[name];
      if (value === undefined) {
        throw new Error(`Missing placeholder ${token}`);
      }
      return String(value);
    });
  };
}

function lookup(content: Content, key: string): string {
  let current: unknown = content;
  for (const part of key.split(".")) {
    if (!isRecord(current) || !(part in current)) {
      throw new Error(`Unknown content key: ${key}`);
    }
    current = current[part];
  }
  if (typeof current !== "string") {
    throw new Error(`Content key ${key} is not a string`);
  }
  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
