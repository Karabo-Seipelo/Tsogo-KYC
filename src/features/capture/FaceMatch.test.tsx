import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { FaceMatch } from "./FaceMatch";

const content = contentSchema.parse(bundled);

test("AC-04.5 comparing shows both photos", () => {
  renderMatch("comparing");

  expect(screen.getByRole("status").textContent).toBe(
    content.faceMatch.comparing,
  );
  expect(
    screen.getByRole("img", { name: content.faceMatch.documentPhoto }),
  ).toHaveProperty("src", expect.stringContaining("document.jpg"));
  expect(
    screen.getByRole("img", { name: content.faceMatch.selfie }),
  ).toHaveProperty("src", expect.stringContaining("selfie.jpg"));
});

test("AC-04.6 a match offers continue", () => {
  renderMatch("matched");

  expect(
    screen.getByRole("heading", { name: content.faceMatch.matched.title }),
  ).toBeDefined();
  expect(
    screen.getByRole("button", { name: content.common.actions.continue }),
  ).toBeDefined();
});

function renderMatch(phase: "comparing" | "matched") {
  render(
    <ContentProvider content={content}>
      <FaceMatch
        phase={phase}
        documentSrc="https://photos.example/document.jpg"
        selfieSrc="https://photos.example/selfie.jpg"
        onContinue={vi.fn()}
      />
    </ContentProvider>,
  );
}
