import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { jsonContentSource } from "./jsonSource";
import { contentSchema } from "./schema";

test("AC-09.2 the json source reads content/en-ZA.json and it matches the schema", async () => {
  const content = await jsonContentSource.read("en-ZA");

  expect(contentSchema.safeParse(content).success).toBe(true);
  expect(content.start.title).toBe(bundled.start.title);
});
