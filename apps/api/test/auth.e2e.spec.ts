import type { NestExpressApplication } from "@nestjs/platform-express";
import { JwtService } from "@nestjs/jwt";
import request from "supertest";

import { createApiApplication } from "../src/app.js";
import { readApiConfiguration } from "../src/config/api-configuration.js";
import {
  getStoredPasswordHash,
  prepareTestDatabase,
  testEnvironment,
} from "./test-database.js";

describe("account session API", () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    await prepareTestDatabase();
    app = await createApiApplication(readApiConfiguration(testEnvironment));
  });

  beforeEach(async () => {
    await prepareTestDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it("registers a normalized email without storing the password in plaintext", async () => {
    const password = "password";
    const response = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ email: "  PERSONA@EXAMPLE.TEST ", password })
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      email: "persona@example.test",
    });
    expect(JSON.stringify(response.body)).not.toContain(password);

    const passwordHash = await getStoredPasswordHash("persona@example.test");
    expect(passwordHash).toMatch(/^\$2[aby]\$/);
    expect(passwordHash).not.toBe(password);
  });

  it("rejects duplicate emails and invalid password lengths without database details", async () => {
    const credentials = { email: "persona@example.test", password: "password" };
    await request(app.getHttpServer()).post("/api/auth/register").send(credentials).expect(201);

    const duplicate = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ ...credentials, email: "PERSONA@EXAMPLE.TEST" })
      .expect(400);
    expect(duplicate.body).toEqual({
      statusCode: 400,
      error: "Bad Request",
      message: "Unable to register account",
    });
    expect(JSON.stringify(duplicate.body)).not.toContain("UQ_users_email");

    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ email: "other@example.test", password: "short" })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ email: "other@example.test", password: "a".repeat(73) })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "password" })
      .expect(400);
  });

  it("authenticates valid credentials and protects the current session", async () => {
    const credentials = { email: "persona@example.test", password: "password" };
    const registered = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(credentials)
      .expect(201);

    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send(credentials)
      .expect(200);
    expect(login.body.accessToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect({ id: registered.body.id, email: credentials.email });
  });

  it("returns the same public response for an unknown email and an incorrect password", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ email: "persona@example.test", password: "password" })
      .expect(201);

    const unknownEmail = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "missing@example.test", password: "password" })
      .expect(401);
    const incorrectPassword = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "persona@example.test", password: "different" })
      .expect(401);

    expect(unknownEmail.body).toEqual(incorrectPassword.body);
  });

  it("rejects missing, invalid, and expired tokens", async () => {
    const credentials = { email: "persona@example.test", password: "password" };
    const registered = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(credentials)
      .expect(201);
    const expiredToken = new JwtService({
      secret: testEnvironment.JWT_SECRET,
    }).sign({ sub: registered.body.id }, { expiresIn: -1 });

    await request(app.getHttpServer()).get("/api/auth/session").expect(401);
    await request(app.getHttpServer())
      .get("/api/auth/session")
      .set("Authorization", "Bearer not-a-token")
      .expect(401);
    await request(app.getHttpServer())
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(401);
  });

  it("documents only registration, login, and current session", async () => {
    const response = await request(app.getHttpServer()).get("/api/docs-json").expect(200);

    expect(response.body.paths).toHaveProperty("/api/auth/register");
    expect(response.body.paths).toHaveProperty("/api/auth/login");
    expect(response.body.paths).toHaveProperty("/api/auth/session");
    expect(Object.keys(response.body.paths)).not.toContain("/api/auth/logout");
  });

  it("keeps the API and health endpoint available when PostgreSQL is unavailable", async () => {
    const unavailableApp = await createApiApplication(
      readApiConfiguration({ ...testEnvironment, POSTGRES_PORT: "65432" }),
    );

    try {
      await request(unavailableApp.getHttpServer())
        .get("/api/health")
        .expect(503)
        .expect({ status: "unavailable" });
      await request(unavailableApp.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "persona@example.test", password: "password" })
        .expect(503)
        .expect({
          statusCode: 503,
          error: "Service Unavailable",
          message: "Authentication service unavailable",
        });
    } finally {
      await unavailableApp.close();
    }
  });
});
