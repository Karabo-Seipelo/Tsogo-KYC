import type { MetadataRoute } from "next";
import { demoModeEnabled } from "@/lib/demoMode";

// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
export default function robots(): MetadataRoute.Robots {
  if (!demoModeEnabled()) {
    return { rules: { userAgent: "*", allow: "/" } };
  }
  return { rules: { userAgent: "*", disallow: "/" } };
}
