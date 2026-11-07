import { defineConfig } from "@playwright/test";

// H-371: intercepted browser fixtures against the existing runtime; no webServer.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "auth-partner-journeys.spec.ts",
  workers: 1,
  timeout: 30_000,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  outputDir: "/tmp/h371-browser-results",
});
