import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useKycMachine } from "./useKycMachine";

function Journey() {
  const { state, send, stepNumber } = useKycMachine();
  return (
    <div>
      <p>{state}</p>
      <p>{stepNumber === null ? "no counter" : `step ${stepNumber}`}</p>
      <button
        type="button"
        onClick={() => send({ type: "START", device: "desktop" })}
      >
        start desktop
      </button>
      <button
        type="button"
        onClick={() => send({ type: "START", device: "phone" })}
      >
        start phone
      </button>
      <button
        type="button"
        onClick={() => send({ type: "CHOOSE_THIS_DEVICE" })}
      >
        this device
      </button>
      <button type="button" onClick={() => send({ type: "CHOOSE_PHONE" })}>
        phone
      </button>
      <button type="button" onClick={() => send({ type: "PHONE_CONNECTED" })}>
        connected
      </button>
      <button type="button" onClick={() => send({ type: "DOC_CAPTURED" })}>
        captured
      </button>
      <button type="button" onClick={() => send({ type: "DOC_VALID" })}>
        valid
      </button>
      <button type="button" onClick={() => send({ type: "SELFIE_CAPTURED" })}>
        selfie
      </button>
      <button type="button" onClick={() => send({ type: "LIVENESS_PASSED" })}>
        liveness
      </button>
      <button type="button" onClick={() => send({ type: "MATCHED" })}>
        matched
      </button>
    </div>
  );
}

test("AC-01.1 the journey starts idle with no counter", () => {
  render(<Journey />);

  expect(screen.getByText("idle")).toBeDefined();
  expect(screen.getByText("no counter")).toBeDefined();
});

test("AC-01.1 START on desktop goes to deviceSelection with no counter", async () => {
  const user = userEvent.setup();
  render(<Journey />);

  await user.click(screen.getByRole("button", { name: "start desktop" }));

  expect(screen.getByText("deviceSelection")).toBeDefined();
  expect(screen.getByText("no counter")).toBeDefined();
});

test("AC-01.1 START on mobile goes to documentUpload on step 1", async () => {
  const user = userEvent.setup();
  render(<Journey />);

  await user.click(screen.getByRole("button", { name: "start phone" }));

  expect(screen.getByText("documentUpload")).toBeDefined();
  expect(screen.getByText("step 1")).toBeDefined();
});

test("AC-01.9 choosing this device reaches step 1", async () => {
  const user = userEvent.setup();
  render(<Journey />);

  await user.click(screen.getByRole("button", { name: "start desktop" }));
  await user.click(screen.getByRole("button", { name: "this device" }));

  expect(screen.getByText("documentUpload")).toBeDefined();
  expect(screen.getByText("step 1")).toBeDefined();
});

test("AC-01.9 the QR handoff has no counter until the phone connects", async () => {
  const user = userEvent.setup();
  render(<Journey />);

  await user.click(screen.getByRole("button", { name: "start desktop" }));
  await user.click(screen.getByRole("button", { name: "phone" }));

  expect(screen.getByText("qrHandoff")).toBeDefined();
  expect(screen.getByText("no counter")).toBeDefined();

  await user.click(screen.getByRole("button", { name: "connected" }));

  expect(screen.getByText("documentUpload")).toBeDefined();
  expect(screen.getByText("step 1")).toBeDefined();
});

test("AC-01.9 stepNumber follows the verification list through review", async () => {
  const user = userEvent.setup();
  render(<Journey />);

  await user.click(screen.getByRole("button", { name: "start phone" }));
  expect(screen.getByText("step 1")).toBeDefined();

  await user.click(screen.getByRole("button", { name: "captured" }));
  expect(screen.getByText("documentValidation")).toBeDefined();
  expect(screen.getByText("step 1")).toBeDefined();

  await user.click(screen.getByRole("button", { name: "valid" }));
  expect(screen.getByText("selfieCapture")).toBeDefined();
  expect(screen.getByText("step 2")).toBeDefined();

  await user.click(screen.getByRole("button", { name: "selfie" }));
  await user.click(screen.getByRole("button", { name: "liveness" }));
  expect(screen.getByText("faceMatch")).toBeDefined();
  expect(screen.getByText("step 3")).toBeDefined();

  await user.click(screen.getByRole("button", { name: "matched" }));
  expect(screen.getByText("review")).toBeDefined();
  expect(screen.getByText("step 4")).toBeDefined();
});
