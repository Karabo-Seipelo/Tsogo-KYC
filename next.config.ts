import type { NextConfig } from "next";
import { demoModeEnabled } from "./src/lib/demoMode";

// Project rules live in .cursor/rules. Stop `next dev` from writing AGENTS.md.
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/agentRules
// A quick-tunnel hostname is not localhost, so the dev server must allow it.
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
// Security headers on every path. CSP follows the non-nonce next.config form so
// pages stay static. Dev adds 'unsafe-eval' because React uses eval for error
// stacks. img-src allows blob: for the on-device thumbnail previews.
// camera=(self) keeps capture working. X-Robots-Tag stays on only while the demo is on.
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
// Source: https://nextjs.org/docs/app/guides/content-security-policy
function contentSecurityPolicy() {
  const devEval =
    process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${devEval}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function securityHeaders() {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(self)" },
  ];
}

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["*.trycloudflare.com"],
  headers() {
    const headers = securityHeaders();
    if (demoModeEnabled()) {
      headers.push({ key: "X-Robots-Tag", value: "noindex" });
    }
    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
