import { defineConfig, devices } from "@playwright/test";

const apiOrigin = "http://127.0.0.1:3101";
const webOrigin = "http://127.0.0.1:4322";
const webServerTimeout = 180_000;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  workers: 1,
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
      url: `${apiOrigin}/api/docs-json`,
      reuseExistingServer: false,
      timeout: webServerTimeout,
      stdout: "pipe",
      env: {
        API_PORT: "3101",
        WEB_ORIGIN: webOrigin,
        JWT_SECRET: "e2e-jwt-secret-only",
        JWT_EXPIRES_IN_SECONDS: "3",
        BCRYPT_COST: "4",
      },
    },
    {
      command: "npm run dev --workspace @primer-parcial/web -- --host 127.0.0.1 --port 4322",
      url: webOrigin,
      reuseExistingServer: false,
      timeout: webServerTimeout,
      stdout: "pipe",
      env: {
        PUBLIC_API_ORIGIN: apiOrigin,
      },
    },
  ],
});
