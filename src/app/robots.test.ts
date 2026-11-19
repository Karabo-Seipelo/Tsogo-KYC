import { afterEach, expect, test, vi } from "vitest";
import nextConfig from "../../next.config";
import robots from "./robots";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("AC-07.6 robots.txt disallows crawling when DEMO_MODE is unset", () => {
  vi.stubEnv("DEMO_MODE", undefined);
  expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
});

test("AC-07.6 robots.txt disallows crawling when DEMO_MODE is true", () => {
  vi.stubEnv("DEMO_MODE", "true");
  expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
});

test("AC-07.6 robots.txt allows crawling when DEMO_MODE is false", () => {
  vi.stubEnv("DEMO_MODE", "false");
  expect(robots()).toEqual({ rules: { userAgent: "*", allow: "/" } });
});

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self)" },
];

test("AC-07.6 every path carries X-Robots-Tag noindex when DEMO_MODE is true", async () => {
  vi.stubEnv("DEMO_MODE", "true");
  expect(await nextConfig.headers?.()).toEqual([
    {
      source: "/:path*",
      headers: [...securityHeaders, { key: "X-Robots-Tag", value: "noindex" }],
    },
  ]);
});

test("AC-07.6 X-Robots-Tag is omitted when DEMO_MODE is false", async () => {
  vi.stubEnv("DEMO_MODE", "false");
  expect(await nextConfig.headers?.()).toEqual([
    { source: "/:path*", headers: securityHeaders },
  ]);
});

test("AC-11.1 every path sends the hardening headers and leaves the camera on", async () => {
  vi.stubEnv("DEMO_MODE", "true");
  const headers = (await nextConfig.headers?.())?.[0]?.headers ?? [];
  const value = (key: string) =>
    headers.find((header) => header.key === key)?.value;

  expect(value("Content-Security-Policy")).toContain("default-src 'self'");
  expect(value("Content-Security-Policy")).toContain("frame-ancestors 'none'");
  expect(value("X-Frame-Options")).toBe("DENY");
  expect(value("X-Content-Type-Options")).toBe("nosniff");
  expect(value("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  expect(value("Permissions-Policy")).toBe("camera=(self)");
  expect(value("Permissions-Policy")).not.toContain("camera=()");
  expect(
    headers.some((header) => header.key === "Access-Control-Allow-Origin"),
  ).toBe(false);
});
