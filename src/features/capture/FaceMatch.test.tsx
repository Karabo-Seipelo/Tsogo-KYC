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

test("AC-04.7 no match shows the reason, the attempt, and both actions", () => {
  const onRetake = vi.fn();
  const onDifferentDocument = vi.fn();
  render(
    <ContentProvider content={content}>
      <FaceMatch
        phase="noMatch"
        documentSrc="https://photos.example/document.jpg"
        selfieSrc="https://photos.example/selfie.jpg"
        attempt={2}
        onContinue={vi.fn()}
        onRetake={onRetake}
        onDifferentDocument={onDifferentDocument}
      />
    </ContentProvider>,
  );

  expect(
    screen.getByRole("heading", { name: content.faceMatch.noMatch.title }),
  ).toBe(document.activeElement);
  expect(screen.getByText(content.faceMatch.noMatch.intro)).toBeDefined();
  for (const tip of content.faceMatch.noMatch.tips) {
    expect(screen.getByText(tip)).toBeDefined();
  }
  expect(screen.getByText("Attempt 2 of 3")).toBeDefined();
  screen
    .getByRole("button", { name: content.faceMatch.noMatch.retake })
    .click();
  screen
    .getByRole("button", { name: content.faceMatch.noMatch.differentDocument })
    .click();
  expect(onRetake).toHaveBeenCalledOnce();
  expect(onDifferentDocument).toHaveBeenCalledOnce();
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
