import type { Content } from "./schema";

type ErrorCode = keyof Content["errors"];

export function errorCopy(content: Content, error: { code: string }) {
  if (isErrorCode(content, error.code)) {
    return content.errors[error.code];
  }
  return content.errors.generic;
}

function isErrorCode(content: Content, code: string): code is ErrorCode {
  return Object.hasOwn(content.errors, code);
}
