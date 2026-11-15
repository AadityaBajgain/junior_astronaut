import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const localChrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3174",
    launchOptions: {
      executablePath:
        process.env.CHROME_PATH ||
        (existsSync(localChrome) ? localChrome : undefined),
    },
  },
  webServer: {
    command: "npm run dev -- --port 3174",
    url: "http://127.0.0.1:3174",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
