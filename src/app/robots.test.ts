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

test("AC-07.6 every path carries X-Robots-Tag noindex when DEMO_MODE is true", async () => {
  vi.stubEnv("DEMO_MODE", "true");
  expect(await nextConfig.headers?.()).toEqual([
    {
      source: "/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex" }],
    },
  ]);
});

test("AC-07.6 X-Robots-Tag is omitted when DEMO_MODE is false", async () => {
  vi.stubEnv("DEMO_MODE", "false");
  expect(await nextConfig.headers?.()).toEqual([]);
});
