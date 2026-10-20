import { defineConfig } from "@playwright/test";

/** Explicitly targets the disposable real backend, separately from mock API tests. */
export default defineConfig({
  testDir: "./tests/integration",
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.INTEGRATION_FRONTEND_URL ?? "http://localhost:3000",
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    trace: "off",
  },
  outputDir: process.env.INTEGRATION_ARTIFACTS ?? "/tmp/joga-solo-acceptance/browser-results",
});
