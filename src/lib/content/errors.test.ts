import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { errorCopy } from "./errors";
import { contentSchema } from "./schema";

const content = contentSchema.parse(bundled);

test("AC-09.7 a known code resolves to errors.SESSION_EXPIRED", () => {
  expect(errorCopy(content, { code: "SESSION_EXPIRED" })).toEqual(
    content.errors.SESSION_EXPIRED,
  );
});

test("AC-09.7 an unknown code uses errors.generic", () => {
  expect(errorCopy(content, { code: "NOT_A_CODE" })).toEqual({
    title: "Something went wrong",
    body: "We couldn't complete that step. Please try again.",
  });
});
