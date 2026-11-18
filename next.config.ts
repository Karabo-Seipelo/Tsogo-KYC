import type { NextConfig } from "next";

// Project rules live in .cursor/rules. Stop `next dev` from writing AGENTS.md.
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/agentRules
// A quick-tunnel hostname is not localhost, so the dev server must allow it.
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
