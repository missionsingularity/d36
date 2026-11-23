import { defineConfig } from "@playwright/test";
const port = process.env.E2E_PORT || "3100";
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "./tests/enterprise-browser",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm.cmd run dev -- --port ${port}`,
    url: `${baseURL}/api/workspace`,
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      NEXT_DIST_DIR: ".next-dev",
      BRAHMA_DATA_DIR: ".test-data/enterprise-browser-" + Date.now(),
      DEMO_MODE: "true",
      GEMINI_API_KEY: "",
    },
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
