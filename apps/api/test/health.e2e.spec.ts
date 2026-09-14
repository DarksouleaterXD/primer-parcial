import type { NestExpressApplication } from "@nestjs/platform-express";
import request from "supertest";
import { DataSource } from "typeorm";

import { createApiApplication } from "../src/app.js";
import { readApiConfiguration } from "../src/config/api-configuration.js";
import { prepareTestDatabase, testEnvironment } from "./test-database.js";

describe("API health", () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    await prepareTestDatabase();
    app = await createApiApplication(readApiConfiguration(testEnvironment));
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns available after a real PostgreSQL check", async () => {
    const destroy = jest.spyOn(DataSource.prototype, "destroy");

    try {
      await request(app.getHttpServer())
        .get("/api/health")
        .expect(200)
        .expect({ status: "available" });

      expect(destroy).toHaveBeenCalledTimes(1);
    } finally {
      destroy.mockRestore();
    }
  });

  it("allows only the configured CORS origin", async () => {
    await request(app.getHttpServer())
      .get("/api/docs-json")
      .set("Origin", testEnvironment.WEB_ORIGIN)
      .expect("access-control-allow-origin", testEnvironment.WEB_ORIGIN)
      .expect(200);

    const deniedOriginResponse = await request(app.getHttpServer())
      .get("/api/docs-json")
      .set("Origin", "http://not-allowed.example")
      .expect(200);

    expect(
      deniedOriginResponse.headers["access-control-allow-origin"],
    ).toBeUndefined();
  });

  it("publishes Swagger UI and OpenAPI health responses", async () => {
    await request(app.getHttpServer()).get("/api/docs").expect(200);

    const response = await request(app.getHttpServer())
      .get("/api/docs-json")
      .expect(200);

    expect(response.body.paths["/api/health"].get.responses).toHaveProperty("200");
    expect(response.body.paths["/api/health"].get.responses).toHaveProperty("503");
  });

  it("starts and reports unavailable when PostgreSQL is unreachable", async () => {
    const unavailableApp = await createApiApplication(
      readApiConfiguration({ ...testEnvironment, POSTGRES_PORT: "65432" }),
    );

    try {
      const response = await request(unavailableApp.getHttpServer())
        .get("/api/health")
        .expect(503);

      expect(response.body).toEqual({ status: "unavailable" });
      expect(JSON.stringify(response.body)).not.toContain(testEnvironment.POSTGRES_PASSWORD);
    } finally {
      await unavailableApp.close();
    }
  });

  it("rejects an empty or wildcard CORS origin before bootstrap", () => {
    expect(() =>
      readApiConfiguration({ ...testEnvironment, WEB_ORIGIN: "" }),
    ).toThrow("WEB_ORIGIN");
    expect(() =>
      readApiConfiguration({ ...testEnvironment, WEB_ORIGIN: "*" }),
    ).toThrow("WEB_ORIGIN");
  });

  it("requires valid authentication configuration before bootstrap", () => {
    expect(() =>
      readApiConfiguration({ ...testEnvironment, JWT_SECRET: "" }),
    ).toThrow("JWT_SECRET");
    expect(() =>
      readApiConfiguration({ ...testEnvironment, JWT_EXPIRES_IN_SECONDS: "0" }),
    ).toThrow("JWT_EXPIRES_IN_SECONDS");
    expect(() =>
      readApiConfiguration({ ...testEnvironment, BCRYPT_COST: "3" }),
    ).toThrow("BCRYPT_COST");
  });
});
