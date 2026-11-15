import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const localChrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
// Set BASE_URL to test a dev server that is already running.
const baseURL = process.env.BASE_URL || "http://127.0.0.1:3174";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  workers: 1,
  use: {
    baseURL,
    launchOptions: {
      executablePath:
        process.env.CHROME_PATH ||
        (existsSync(localChrome) ? localChrome : undefined),
    },
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --port 3174",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120000,
      },
});
