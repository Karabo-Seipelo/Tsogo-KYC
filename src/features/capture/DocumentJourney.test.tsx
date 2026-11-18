import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "../../lib/content/ContentProvider";
import { contentSchema } from "../../lib/content/schema";
import { DocumentJourney } from "./DocumentJourney";

const content = contentSchema.parse(bundled);

afterEach(() => {
  vi.unstubAllGlobals();
});

test("R-03.6 a passing photo sends DOC_CAPTURED and Continue sends DOC_VALID", async () => {
  const user = userEvent.setup();
  const send = vi.fn();
  const result = deferredResponse({ passed: true, checks: [] });
  stubFetch(result.promise);
  renderJourney(send);

  await user.click(radio(content.document.select.options.passport.title));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(
    screen.getByRole("button", { name: content.document.capture.takePhoto }),
  );

  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    content.document.checking,
  );
  result.resolve(json({ passed: true, checks: [] }));

  expect(
    await screen.findByRole("heading", {
      name: content.document.result.passed.title,
    }),
  ).toBeDefined();
  expect(send).toHaveBeenCalledWith({ type: "DOC_CAPTURED" });

  await user.click(
    screen.getByRole("button", { name: content.common.actions.continue }),
  );
  expect(send).toHaveBeenCalledWith({ type: "DOC_VALID" });
});

test("R-03.6 a failed check sends DOC_INVALID", async () => {
  const user = userEvent.setup();
  const send = vi.fn();
  stubFetch(Promise.resolve(json({ passed: false, checks: [] })));
  renderJourney(send);

  await user.click(radio(content.document.select.options.passport.title));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(
    screen.getByRole("button", { name: content.document.capture.takePhoto }),
  );

  const heading = await screen.findByRole("heading", {
    name: content.document.result.failed.title,
  });
  expect(heading).toBe(document.activeElement);
  expect(
    screen.getByText(content.document.result.failed.reasons.blurry.intro),
  ).toBeDefined();
  expect(screen.getByText("Attempt 1 of 3")).toBeDefined();
  expect(send).toHaveBeenCalledWith({ type: "DOC_CAPTURED" });
  expect(send).toHaveBeenCalledWith({ type: "DOC_INVALID" });
});

test("R-03.6 an upload that does not complete sends UPLOAD_FAILED", async () => {
  const user = userEvent.setup();
  const send = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline"))),
  );
  renderJourney(send);

  await user.click(radio(content.document.select.options.passport.title));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(
    screen.getByRole("button", { name: content.document.capture.takePhoto }),
  );

  expect(
    await screen.findByRole("heading", {
      name: content.errors.UPLOAD_FAILED.message,
    }),
  ).toBeDefined();
  expect(send).toHaveBeenCalledWith({ type: "UPLOAD_FAILED" });
  expect(send).not.toHaveBeenCalledWith({ type: "DOC_CAPTURED" });
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
});

test("AC-03.8 Try again sends the saved photo after the automatic retries", async () => {
  const user = userEvent.setup();
  const bodies: FormData[] = [];
  let calls = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init: { body: FormData }) => {
      calls += 1;
      bodies.push(init.body);
      if (calls < 4) {
        return Promise.reject(new Error("offline"));
      }
      return Promise.resolve(json({ passed: true, checks: [] }));
    }),
  );
  renderJourney(vi.fn());

  await user.click(radio(content.document.select.options.passport.title));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(
    screen.getByRole("button", { name: content.document.capture.takePhoto }),
  );
  await user.click(
    await screen.findByRole("button", {
      name: content.errors.UPLOAD_FAILED.cta,
    }),
  );

  expect(
    await screen.findByRole("heading", {
      name: content.document.result.passed.title,
    }),
  ).toBeDefined();
  expect(calls).toBe(4);
  const first = bodies[0]?.get("thumbnail");
  const again = bodies[3]?.get("thumbnail");
  expect(await blobText(first)).toBe(await blobText(again));
});

function renderJourney(send: (event: { type: string }) => void) {
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: vi.fn() }],
      })),
    },
  });
  render(
    <ContentProvider content={content}>
      <DocumentJourney send={send} />
    </ContentProvider>,
  );
}

function stubFetch(response: Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => response),
  );
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function deferredResponse(body: unknown) {
  let resolve: (response: Response) => void = () => undefined;
  const promise = new Promise<Response>((done) => {
    resolve = done;
  });
  return {
    promise,
    resolve: (response: Response = json(body)) => resolve(response),
  };
}

async function blobText(value: FormDataEntryValue | null | undefined) {
  if (value && typeof value !== "string" && "text" in value) {
    return value.text();
  }
  return "";
}

function radio(title: string) {
  const element = screen.getByRole("radio", {
    name: (name) => name.startsWith(title),
  });
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`${title} is not a radio input`);
  }
  return element;
}
