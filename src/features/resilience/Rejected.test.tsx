import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { Rejected } from "./Rejected";

const content = contentSchema.parse(bundled);
const reference = "AB12";

test("AC-06.5 a rejection shows a support reference and the next steps", async () => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  const { container } = render(
    <ContentProvider content={content}>
      <Rejected reference={reference} onRetry={onRetry} />
    </ContentProvider>,
  );

  const copy = content.errors.VERIFICATION_REJECTED;
  const heading = screen.getByRole("heading", { name: copy.title, level: 1 });
  expect(document.activeElement).toBe(heading);
  expect(screen.getByText(copy.body)).toBeDefined();
  expect(
    screen.getByRole("heading", { name: copy.nextStepsTitle, level: 2 }),
  ).toBeDefined();
  expect(screen.getByText(copy.nextSteps[0])).toBeDefined();
  expect(
    screen.getByText(copy.nextSteps[1].replaceAll("{reference}", reference)),
  ).toBeDefined();
  expect(container.textContent).not.toMatch(
    /blurry|glare|cropped|fraud|confidence|corners|readable|notExpired/i,
  );

  await user.click(screen.getByRole("button", { name: copy.tryAgain }));
  expect(onRetry).toHaveBeenCalledOnce();
  expect(
    screen.getByRole("button", { name: copy.contactSupport }),
  ).toBeDefined();
});
