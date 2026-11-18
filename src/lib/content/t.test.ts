import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { contentSchema } from "./schema";
import { createT } from "./t";

const t = createT(contentSchema.parse(bundled));

test("AC-09.5 fills {time}", () => {
  expect(t("handoff.expiresIn", { time: "5:00" })).toBe("Code expires in 5:00");
});

test("AC-09.5 fills {reference}", () => {
  expect(t("manualReview.reference", { reference: "AB12" })).toBe(
    "Your reference: AB12",
  );
});

test("AC-09.5 fills {attempt}", () => {
  expect(t("common.attempt", { attempt: 2, max: 3 })).toBe("Attempt 2 of 3");
});

test("AC-09.5 a missing placeholder value throws in development", () => {
  withNodeEnv("development", () => {
    expect(() => t("handoff.expiresIn")).toThrow("{time}");
  });
});

test("AC-09.5 a missing placeholder value throws in production", () => {
  withNodeEnv("production", () => {
    expect(() => t("handoff.expiresIn")).toThrow("{time}");
  });
});

function withNodeEnv(nodeEnv: string, run: () => void) {
  const env = process.env as { NODE_ENV?: string };
  const previous = env.NODE_ENV;
  env.NODE_ENV = nodeEnv;
  try {
    run();
  } finally {
    env.NODE_ENV = previous;
  }
}
