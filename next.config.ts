import type { NextConfig } from "next";

// Project rules live in .cursor/rules. Stop `next dev` from writing AGENTS.md.
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/agentRules
const nextConfig: NextConfig = {
  agentRules: false,
};

export default nextConfig;
