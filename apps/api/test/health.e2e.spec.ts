import type { NestExpressApplication } from "@nestjs/platform-express";
import request from "supertest";
import { DataSource } from "typeorm";

import { createApiApplication } from "../src/app.js";
import { readApiConfiguration } from "../src/config/api-configuration.js";

const environment = {
  API_PORT: "3000",
  WEB_ORIGIN: "http://localhost:4321",
  POSTGRES_HOST: "127.0.0.1",
  POSTGRES_PORT: "5432",
  POSTGRES_DB: "primer_parcial",
  POSTGRES_USER: "primer_parcial_local",
  POSTGRES_PASSWORD: "local-example-only",
};

describe("API health", () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createApiApplication(readApiConfiguration(environment));
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
      .set("Origin", environment.WEB_ORIGIN)
      .expect("access-control-allow-origin", environment.WEB_ORIGIN)
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
      readApiConfiguration({ ...environment, POSTGRES_PORT: "65432" }),
    );

    try {
      const response = await request(unavailableApp.getHttpServer())
        .get("/api/health")
        .expect(503);

      expect(response.body).toEqual({ status: "unavailable" });
      expect(JSON.stringify(response.body)).not.toContain(environment.POSTGRES_PASSWORD);
    } finally {
      await unavailableApp.close();
    }
  });

  it("rejects an empty or wildcard CORS origin before bootstrap", () => {
    expect(() =>
      readApiConfiguration({ ...environment, WEB_ORIGIN: "" }),
    ).toThrow("WEB_ORIGIN");
    expect(() =>
      readApiConfiguration({ ...environment, WEB_ORIGIN: "*" }),
    ).toThrow("WEB_ORIGIN");
  });
});
