import { execFileSync, execSync } from "node:child_process";

import { expect, test, type Page } from "@playwright/test";

const apiOrigin = "http://127.0.0.1:3000";
const primaryEmail = "e2e-cu1-primary@example.test";
const password = "e2e-password";
const firstName = "Persona";
const lastName = "E2E";

function isSessionRequest(url: string): boolean {
  return new URL(url).pathname === "/api/auth/session";
}

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

function migrationEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    API_PORT: "3000",
    WEB_ORIGIN: "http://localhost:4321",
    JWT_SECRET: "e2e-jwt-secret-only",
    JWT_EXPIRES_IN_SECONDS: "3",
    BCRYPT_COST: "4",
  };
}

function runMigrations(): void {
  execSync("npm run migration:run --workspace @primer-parcial/api", {
    cwd: process.cwd(),
    encoding: "utf8",
    env: migrationEnvironment(),
  });
}

function clearE2eAccounts(): void {
  compose(
    "exec",
    "-T",
    "postgres",
    "psql",
    "-U",
    "primer_parcial_local",
    "-d",
    "primer_parcial",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "DELETE FROM \"users\" WHERE \"email\" LIKE 'e2e-cu1-%@example.test'",
  );
}

async function fillLogin(page: Page, email: string, value: string) {
  await expect(page.getByRole("button", { name: "Entrar al área privada" })).toBeEnabled();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(value);
}

async function fillRegistration(
  page: Page,
  input: { readonly firstName: string; readonly lastName: string; readonly email: string; readonly password: string },
) {
  await expect(page.getByRole("button", { name: "Registrar cuenta" })).toBeEnabled();
  await page.getByLabel("Nombres").fill(input.firstName);
  await page.getByLabel("Apellidos").fill(input.lastName);
  await page.getByLabel("Email").fill(input.email);
  await page.getByLabel("Contraseña").fill(input.password);
}

async function login(page: Page) {
  await page.goto("/login");
  const sessionRequest = page.waitForRequest((request) => isSessionRequest(request.url()));
  await fillLogin(page, primaryEmail, password);
  await page.getByRole("button", { name: "Entrar al área privada" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  return sessionRequest;
}

test.describe("Cuenta y sesión con PostgreSQL real", () => {
  test.describe.configure({ mode: "serial" });

  let postgresWasRunning = false;
  let migrationCompleted = false;

  test.beforeAll(() => {
    postgresWasRunning = postgresIsRunning();
    if (!postgresWasRunning) {
      startPostgres();
    }
    runMigrations();
    migrationCompleted = true;
    clearE2eAccounts();
  });

  test.afterAll(() => {
    try {
      if (migrationCompleted) {
        clearE2eAccounts();
      }
    } finally {
      restorePostgres(postgresWasRunning);
    }
  });

  test("registra nombres, apellidos y email normalizado, y muestra errores públicos seguros", async ({ page }) => {
    await page.goto("/register");
    await fillRegistration(page, {
      firstName: ` ${firstName} `,
      lastName: ` ${lastName} `,
      email: "  E2E-CU1-PRIMARY@EXAMPLE.TEST ",
      password,
    });
    await page.getByRole("button", { name: "Registrar cuenta" }).click();
    await expect(page.getByText("Cuenta creada. Ahora podés iniciar sesión.")).toBeVisible();

    await page.reload();
    await fillRegistration(page, { firstName, lastName, email: "E2E-CU1-PRIMARY@EXAMPLE.TEST", password });
    await page.getByRole("button", { name: "Registrar cuenta" }).click();
    const duplicateError = page.getByRole("alert");
    await expect(duplicateError).toHaveText("Unable to register account");
    await expect(duplicateError).not.toContainText(/password_hash|UQ_users_email|postgres/i);

    await page.reload();
    await fillRegistration(page, {
      firstName,
      lastName,
      email: "e2e-cu1-short@example.test",
      password: "short",
    });
    await page.getByRole("button", { name: "Registrar cuenta" }).click();
    await expect(page.getByRole("alert")).toHaveText(/8 a 72 bytes/);

    await page.reload();
    await fillRegistration(page, {
      firstName,
      lastName,
      email: "e2e-cu1-long@example.test",
      password: "a".repeat(70) + "é".repeat(2),
    });
    await page.getByRole("button", { name: "Registrar cuenta" }).click();
    await expect(page.getByRole("alert")).toHaveText(/8 a 72 bytes/);

    await page.reload();
    await fillRegistration(page, {
      firstName: " ",
      lastName,
      email: "e2e-cu1-empty-first-name@example.test",
      password,
    });
    await page.getByRole("button", { name: "Registrar cuenta" }).click();
    await expect(page.getByRole("alert")).toHaveText(/nombres y apellidos/i);

    await page.reload();
    await fillRegistration(page, {
      firstName,
      lastName: " ",
      email: "e2e-cu1-empty-last-name@example.test",
      password,
    });
    await page.getByRole("button", { name: "Registrar cuenta" }).click();
    await expect(page.getByRole("alert")).toHaveText(/nombres y apellidos/i);
  });

  test("inicia sesión, confirma Bearer y cierra sesión sin endpoint remoto", async ({ page }) => {
    const sessionRequest = await login(page);
    await expect(page.getByText("Área privada")).toBeVisible();
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();
    expect((await sessionRequest).headers().authorization).toMatch(/^Bearer\s+.+/);
    await expect
      .poll(() =>
        page.evaluate(() => ({
          session: window.sessionStorage.getItem("primer-parcial.session-token"),
          local: window.localStorage.getItem("primer-parcial.session-token"),
        })),
      )
      .toEqual({ session: expect.any(String), local: null });

    const logoutRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/logout")) {
        logoutRequests.push(request.url());
      }
    });
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect
      .poll(() => page.evaluate(() => window.sessionStorage.getItem("primer-parcial.session-token")))
      .toBeNull();
    expect(logoutRequests).toEqual([]);

    const swagger = await page.request.get(`${apiOrigin}/api/docs-json`);
    expect(swagger.ok()).toBe(true);
    expect(Object.keys((await swagger.json()).paths)).not.toContain("/api/auth/logout");
  });

  test("mantiene el mismo error de credenciales y rechaza sesiones ausentes, inválidas o vencidas", async ({ page }) => {
    await page.goto("/login");
    await fillLogin(page, "e2e-cu1-missing@example.test", password);
    await page.getByRole("button", { name: "Entrar al área privada" }).click();
    const missingAccountError = await page.getByRole("alert").textContent();

    await page.reload();
    await fillLogin(page, primaryEmail, "incorrect-password");
    await page.getByRole("button", { name: "Entrar al área privada" }).click();
    expect(await page.getByRole("alert").textContent()).toBe(missingAccountError);

    let anonymousSessionRequests = 0;
    page.on("request", (request) => {
      if (isSessionRequest(request.url())) {
        anonymousSessionRequests += 1;
      }
    });
    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/login$/);
    expect(anonymousSessionRequests).toBe(0);

    await page.evaluate(() => {
      window.sessionStorage.setItem("primer-parcial.session-token", "invalid-token");
    });
    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/login$/);
    await expect
      .poll(() => page.evaluate(() => window.sessionStorage.getItem("primer-parcial.session-token")))
      .toBeNull();

    await login(page);
    await page.waitForTimeout(4_000);
    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/login$/);
    await expect
      .poll(() => page.evaluate(() => window.sessionStorage.getItem("primer-parcial.session-token")))
      .toBeNull();
  });
});
