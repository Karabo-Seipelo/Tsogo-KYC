import type { NextConfig } from "next";
import { demoModeEnabled } from "./src/lib/demoMode";

// Project rules live in .cursor/rules. Stop `next dev` from writing AGENTS.md.
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/agentRules
// A quick-tunnel hostname is not localhost, so the dev server must allow it.
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
// X-Robots-Tag on every path while the demo is on.
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["*.trycloudflare.com"],
  headers() {
    if (!demoModeEnabled()) {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
