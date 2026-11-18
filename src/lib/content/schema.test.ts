import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { contentSchema } from "./schema";

test("the bundled en-ZA file matches the content schema", () => {
  expect(contentSchema.safeParse(bundled).success).toBe(true);
});

test("AC-09.2 a payload missing start.title fails validation", () => {
  const payload = structuredClone(bundled);
  Reflect.deleteProperty(payload.start, "title");

  expect(contentSchema.safeParse(payload).success).toBe(false);
});
