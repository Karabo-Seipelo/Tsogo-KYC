import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import bundled from "../../content/en-ZA.json";
import { contentSchema } from "@/lib/content/schema";
import RootLayout from "./layout";

vi.mock("next/font/google", () => ({
  Montserrat: () => ({ variable: "--font-montserrat" }),
}));

const content = contentSchema.parse(bundled);

afterEach(() => {
  vi.unstubAllEnvs();
});

test("AC-07.6 the demo banner sits above every route when DEMO_MODE is unset", () => {
  vi.stubEnv("DEMO_MODE", undefined);
  renderRoutes();
  expect(screen.getByText(content.common.demoBanner.long)).toBeDefined();
  expect(screen.getByText(content.common.demoBanner.short)).toBeDefined();
});

test("AC-07.6 the demo banner sits above every route when DEMO_MODE is true", () => {
  vi.stubEnv("DEMO_MODE", "true");
  renderRoutes();
  expect(screen.getByText(content.common.demoBanner.long)).toBeDefined();
});

test("AC-07.6 the demo banner is absent when DEMO_MODE is false", () => {
  vi.stubEnv("DEMO_MODE", "false");
  renderRoutes();
  expect(screen.queryByText(content.common.demoBanner.long)).toBeNull();
  expect(screen.queryByText(content.common.demoBanner.short)).toBeNull();
  expect(screen.getByText("Privacy")).toBeDefined();
  expect(screen.getByText("Saved")).toBeDefined();
  expect(screen.getByText("Error")).toBeDefined();
});

function renderRoutes() {
  render(
    <RootLayout>
      <p>Privacy</p>
      <p>Saved</p>
      <p>Error</p>
    </RootLayout>,
  );
  const banner = screen.queryByText(content.common.demoBanner.short);
  const privacy = screen.getByText("Privacy");
  if (banner) {
    expect(
      banner.compareDocumentPosition(privacy) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
}
