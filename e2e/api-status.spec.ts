import { execFileSync } from "node:child_process";

import { expect, test } from "@playwright/test";

function compose(...arguments_: string[]): string {
  return execFileSync("docker", ["compose", ...arguments_], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

function postgresIsRunning(): boolean {
  return compose("ps", "--status", "running", "--services")
    .split(/\r?\n/)
    .includes("postgres");
}

function startPostgres(): void {
  compose("up", "-d", "--wait", "postgres");
  compose(
    "exec",
    "-T",
    "postgres",
    "pg_isready",
    "-U",
    "primer_parcial_local",
    "-d",
    "primer_parcial",
  );
}

function restorePostgres(wasRunning: boolean): void {
  if (wasRunning) {
    startPostgres();
    return;
  }

  compose("stop", "postgres");
}

test.describe("ApiStatus con PostgreSQL real", () => {
  test.describe.configure({ mode: "serial" });

  let postgresWasRunning = false;

  test.beforeAll(() => {
    postgresWasRunning = postgresIsRunning();
    if (!postgresWasRunning) {
      startPostgres();
    }
  });

  test.afterAll(() => {
    restorePostgres(postgresWasRunning);
  });

  test("muestra API disponible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("API disponible", { exact: true })).toBeVisible();
  });

  test("muestra API no disponible y se recupera", async ({ browser }) => {
    test.setTimeout(60_000);

    try {
      compose("stop", "postgres");

      const unavailablePage = await browser.newPage();
      try {
        await unavailablePage.goto("/");
        await expect(
          unavailablePage.getByText("API no disponible", { exact: true }),
        ).toBeVisible();
      } finally {
        await unavailablePage.close();
      }

      startPostgres();

      const recoveredPage = await browser.newPage();
      try {
        await recoveredPage.goto("/");
        await expect(
          recoveredPage.getByText("API disponible", { exact: true }),
        ).toBeVisible();
      } finally {
        await recoveredPage.close();
      }
    } finally {
      restorePostgres(postgresWasRunning);
    }
  });
});
