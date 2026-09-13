import { defineConfig, devices } from "@playwright/test";

const webOrigin = "http://localhost:4321";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: webOrigin,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev --workspace @primer-parcial/api",
      url: "http://127.0.0.1:3000/api/health",
      reuseExistingServer: !process.env.CI,
      env: {
        API_PORT: "3000",
        WEB_ORIGIN: webOrigin,
      },
    },
    {
      command: "npm run dev --workspace @primer-parcial/web -- --host 127.0.0.1",
      url: webOrigin,
      reuseExistingServer: !process.env.CI,
      env: {
        PUBLIC_API_ORIGIN: "http://127.0.0.1:3000",
      },
    },
  ],
});
