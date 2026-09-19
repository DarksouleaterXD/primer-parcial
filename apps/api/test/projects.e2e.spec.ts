import type { NestExpressApplication } from "@nestjs/platform-express";
import request from "supertest";

import { createApiApplication } from "../src/app.js";
import { readApiConfiguration } from "../src/config/api-configuration.js";
import { createTestDataSource, prepareTestDatabase, testEnvironment } from "./test-database.js";

describe("private UML project API", () => {
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

  it("requires authentication for every project route", async () => {
    const id = crypto.randomUUID();
    await request(app.getHttpServer()).post("/api/projects").send({ name: "Private" }).expect(401);
    await request(app.getHttpServer()).get("/api/projects").expect(401);
    await request(app.getHttpServer()).get(`/api/projects/${id}`).expect(401);
    await request(app.getHttpServer()).patch(`/api/projects/${id}/name`).send({ name: "X", expectedRevision: 0 }).expect(401);
    await request(app.getHttpServer()).put(`/api/projects/${id}/document`).send({ document: {}, expectedRevision: 0 }).expect(401);
    await request(app.getHttpServer()).delete(`/api/projects/${id}`).send({ expectedRevision: 0 }).expect(401);
  });

  it("creates a canonical private project and rejects ownerId or invalid names", async () => {
    const owner = await session("owner-create@example.test");
    const created = await createProject(owner.token, "  Project A  ");

    expect(created.body).toMatchObject({
      id: expect.any(String),
      name: "Project A",
      revision: 0,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(created.body.document).toMatchObject({
      id: created.body.id,
      name: "Project A",
      ownerId: owner.id,
      revision: 0,
      createdAt: created.body.createdAt,
      updatedAt: created.body.updatedAt,
      uml: { packages: [], classes: [], enumerations: [], associations: [], generalizations: [] },
      layout: { nodes: [] },
    });

    await request(app.getHttpServer())
      .post("/api/projects")
      .set(auth(owner.token))
      .send({ name: "Bad", ownerId: crypto.randomUUID() })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/projects")
      .set(auth(owner.token))
      .send({ name: "   " })
      .expect(400);

    expect(await projectCount()).toBe(1);
  });

  it("lists only private summaries and makes foreign and missing get indistinguishable", async () => {
    const ownerA = await session("owner-a@example.test");
    const ownerB = await session("owner-b@example.test");
    const a = await createProject(ownerA.token, "A");
    const b = await createProject(ownerB.token, "B");

    const listed = await request(app.getHttpServer()).get("/api/projects").set(auth(ownerA.token)).expect(200);
    expect(listed.body).toEqual({
      projects: [
        {
          id: a.body.id,
          name: "A",
          revision: 0,
          createdAt: a.body.createdAt,
          updatedAt: a.body.updatedAt,
        },
      ],
    });
    expect(JSON.stringify(listed.body)).not.toContain(b.body.id);
    expect(JSON.stringify(listed.body)).not.toContain("document");

    const foreign = await request(app.getHttpServer()).get(`/api/projects/${b.body.id}`).set(auth(ownerA.token)).expect(404);
    const missing = await request(app.getHttpServer()).get(`/api/projects/${crypto.randomUUID()}`).set(auth(ownerA.token)).expect(404);
    expect(foreign.body).toEqual({ code: "PROJECT_NOT_FOUND" });
    expect(missing.body).toEqual(foreign.body);

    const foreignRename = await request(app.getHttpServer())
      .patch(`/api/projects/${b.body.id}/name`)
      .set(auth(ownerA.token))
      .send({ name: "Hidden", expectedRevision: 0 })
      .expect(404);
    expect(foreignRename.body).toEqual(foreign.body);

    const foreignSave = await request(app.getHttpServer())
      .put(`/api/projects/${b.body.id}/document`)
      .set(auth(ownerA.token))
      .send({ document: b.body.document, expectedRevision: 0 })
      .expect(404);
    expect(foreignSave.body).toEqual(foreign.body);
  });

  it("renames atomically and returns a safe conflict without mutating on stale revision", async () => {
    const owner = await session("rename@example.test");
    const created = await createProject(owner.token, "Before");

    const renamed = await request(app.getHttpServer())
      .patch(`/api/projects/${created.body.id}/name`)
      .set(auth(owner.token))
      .send({ name: "After", expectedRevision: 0 })
      .expect(200);
    expect(renamed.body.name).toBe("After");
    expect(renamed.body.revision).toBe(1);
    expect(renamed.body.document.name).toBe("After");
    expect(renamed.body.document.revision).toBe(1);
    expect(renamed.body.document.updatedAt).toBe(renamed.body.updatedAt);

    const stale = await request(app.getHttpServer())
      .patch(`/api/projects/${created.body.id}/name`)
      .set(auth(owner.token))
      .send({ name: "Stale", expectedRevision: 0 })
      .expect(409);
    expectSafeConflict(stale.body);

    const current = await request(app.getHttpServer()).get(`/api/projects/${created.body.id}`).set(auth(owner.token)).expect(200);
    expect(current.body.name).toBe("After");
    expect(current.body.revision).toBe(1);
  });

  it("saves only a valid canonical document with matching immutable metadata", async () => {
    const owner = await session("save@example.test");
    const created = await createProject(owner.token, "Save");
    const packageId = crypto.randomUUID();
    const nextDocument = {
      ...created.body.document,
      uml: {
        ...created.body.document.uml,
        packages: [{ kind: "package", id: packageId, name: "Domain" }],
      },
    };

    const saved = await request(app.getHttpServer())
      .put(`/api/projects/${created.body.id}/document`)
      .set(auth(owner.token))
      .send({ document: nextDocument, expectedRevision: 0 })
      .expect(200);
    expect(saved.body.revision).toBe(1);
    expect(saved.body.document.revision).toBe(1);
    expect(saved.body.document.uml.packages).toEqual([{ kind: "package", id: packageId, name: "Domain" }]);

    const stale = await request(app.getHttpServer())
      .put(`/api/projects/${created.body.id}/document`)
      .set(auth(owner.token))
      .send({ document: nextDocument, expectedRevision: 0 })
      .expect(409);
    expectSafeConflict(stale.body);

    const forged = { ...saved.body.document, ownerId: crypto.randomUUID() };
    await request(app.getHttpServer())
      .put(`/api/projects/${created.body.id}/document`)
      .set(auth(owner.token))
      .send({ document: forged, expectedRevision: 1 })
      .expect(400)
      .expect({ code: "PROJECT_DOCUMENT_INVALID" });

    const semanticallyInvalid = {
      ...saved.body.document,
      uml: {
        ...saved.body.document.uml,
        packages: [{ kind: "package", id: packageId, name: "" }],
      },
    };
    await request(app.getHttpServer())
      .put(`/api/projects/${created.body.id}/document`)
      .set(auth(owner.token))
      .send({ document: semanticallyInvalid, expectedRevision: 1 })
      .expect(400)
      .expect({ code: "PROJECT_DOCUMENT_INVALID" });

    const current = await request(app.getHttpServer()).get(`/api/projects/${created.body.id}`).set(auth(owner.token)).expect(200);
    expect(current.body.revision).toBe(1);
    expect(current.body.document.uml.packages).toEqual([{ kind: "package", id: packageId, name: "Domain" }]);
  });

  it("deletes conditionally and keeps foreign resources indistinguishable", async () => {
    const owner = await session("delete-owner@example.test");
    const other = await session("delete-other@example.test");
    const created = await createProject(owner.token, "Delete");

    const foreign = await request(app.getHttpServer())
      .delete(`/api/projects/${created.body.id}`)
      .set(auth(other.token))
      .send({ expectedRevision: 0 })
      .expect(404);
    expect(foreign.body).toEqual({ code: "PROJECT_NOT_FOUND" });

    const stale = await request(app.getHttpServer())
      .delete(`/api/projects/${created.body.id}`)
      .set(auth(owner.token))
      .send({ expectedRevision: 5 })
      .expect(409);
    expectSafeConflict(stale.body);

    await request(app.getHttpServer())
      .delete(`/api/projects/${created.body.id}`)
      .set(auth(owner.token))
      .send({ expectedRevision: 0 })
      .expect(204);
    await request(app.getHttpServer()).get(`/api/projects/${created.body.id}`).set(auth(owner.token)).expect(404);
  });

  it("allows only one of two concurrent writes with the same expected revision", async () => {
    const owner = await session("concurrency@example.test");
    const created = await createProject(owner.token, "Concurrent");

    const responses = await Promise.all([
      request(app.getHttpServer())
        .patch(`/api/projects/${created.body.id}/name`)
        .set(auth(owner.token))
        .send({ name: "Writer A", expectedRevision: 0 }),
      request(app.getHttpServer())
        .patch(`/api/projects/${created.body.id}/name`)
        .set(auth(owner.token))
        .send({ name: "Writer B", expectedRevision: 0 }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const conflict = responses.find((response) => response.status === 409);
    expectSafeConflict(conflict?.body);

    const current = await request(app.getHttpServer()).get(`/api/projects/${created.body.id}`).set(auth(owner.token)).expect(200);
    expect(current.body.revision).toBe(1);
    expect(["Writer A", "Writer B"]).toContain(current.body.name);
  });

  it("documents the approved project REST surface", async () => {
    const response = await request(app.getHttpServer()).get("/api/docs-json").expect(200);
    expect(response.body.paths).toHaveProperty("/api/projects");
    expect(response.body.paths).toHaveProperty("/api/projects/{projectId}");
    expect(response.body.paths).toHaveProperty("/api/projects/{projectId}/name");
    expect(response.body.paths).toHaveProperty("/api/projects/{projectId}/document");
    expect(response.body.paths["/api/projects/{projectId}/name"].patch.responses).toHaveProperty("409");
    expect(response.body.paths["/api/projects/{projectId}/document"].put.responses).toHaveProperty("400");
  });

  async function session(email: string): Promise<{ readonly id: string; readonly token: string }> {
    const registration = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ firstName: "Project", lastName: "Owner", email, password: "password" })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password: "password" })
      .expect(200);
    return { id: registration.body.id, token: login.body.accessToken };
  }

  async function createProject(token: string, name: string) {
    return request(app.getHttpServer()).post("/api/projects").set(auth(token)).send({ name }).expect(201);
  }
});

function auth(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

function expectSafeConflict(body: unknown): void {
  expect(body).toEqual({ code: "PROJECT_REVISION_CONFLICT" });
  expect(Object.keys(body as Record<string, unknown>)).toEqual(["code"]);
  const serialized = JSON.stringify(body);
  expect(serialized).not.toMatch(/document|owner|createdAt|updatedAt|uml|postgres|sql/i);
}

async function projectCount(): Promise<number> {
  const dataSource = createTestDataSource();
  await dataSource.initialize();
  try {
    const rows = await dataSource.query<{ count: string }[]>('SELECT count(*)::text AS count FROM "uml_projects"');
    return Number(rows[0]?.count ?? "0");
  } finally {
    await dataSource.destroy();
  }
}
