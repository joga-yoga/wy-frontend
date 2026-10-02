import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/blog",
  testMatch: "*.spec.ts",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3220", trace: "retain-on-failure" },
  webServer: [
    {
      command: "node --import tsx tests/blog/mock-api.ts",
      url: "http://127.0.0.1:4020/health",
      reuseExistingServer: false,
    },
    {
      // Intentionally set the fixture flag in production: it must still use HTTP.
      command:
        "API_ENDPOINT=http://127.0.0.1:4020 BLOG_USE_LOCAL_FIXTURES=1 yarn start --hostname 127.0.0.1 --port 3220",
      url: "http://127.0.0.1:3220/blog",
      reuseExistingServer: false,
    },
  ],
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
});
