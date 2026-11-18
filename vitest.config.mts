import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Vitest 5 resolves tsconfig paths itself. The Next.js Vitest guide still
// installs vite-tsconfig-paths; this version warns that the plugin is redundant.
// Source: the warning from Vitest 5.1.0, and
// https://nextjs.org/docs/app/guides/testing/vitest
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
  },
});
