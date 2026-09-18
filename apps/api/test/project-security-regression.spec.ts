import { randomUUID } from "node:crypto";

import {
  createProjectDocument,
  type ProjectDocument,
} from "@primer-parcial/uml-domain";
import type { DataSource } from "typeorm";

import { UmlProjectRepository } from "../src/projects/uml-project.repository.js";
import {
  createTestDataSource,
  prepareTestDatabase,
} from "./test-database.js";

const FIXED_TIME = "2026-09-18T04:00:00.000Z";

describe("CU-3 project persistence security regression", () => {
  let dataSource: DataSource;
  let repository: UmlProjectRepository;

  beforeAll(async () => {
    await prepareTestDatabase();
    dataSource = createTestDataSource();
    await dataSource.initialize();
    repository = new UmlProjectRepository(dataSource);
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE "uml_projects", "users" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it("round-trips one canonical rich document through JSONB without exposing it to another owner", async () => {
    const ownerId = randomUUID();
    const otherOwnerId = randomUUID();
    await insertUser(dataSource, ownerId, "roundtrip-owner@example.test");
    await insertUser(dataSource, otherOwnerId, "roundtrip-other@example.test");
    const document = richDocument(ownerId, randomUUID());

    await repository.insert(ownerId, document);

    const reopened = await repository.findOwnedById(ownerId, document.id);
    const foreign = await repository.findOwnedById(otherOwnerId, document.id);
    const listedByOther = await repository.listOwned(otherOwnerId);

    expect(reopened).toEqual(document);
    expect(reopened?.uml).toEqual(document.uml);
    expect(reopened?.layout).toEqual(document.layout);
    expect(reopened?.generationProfile).toEqual(document.generationProfile);
    expect(reopened?.revision).toBe(document.revision);
    expect(reopened?.createdAt).toBe(document.createdAt);
    expect(reopened?.updatedAt).toBe(document.updatedAt);
    expect(foreign).toBeNull();
    expect(listedByOther).toEqual([]);
  });

  it("keeps stale and foreign writes non-mutating and allows exactly one concurrent writer", async () => {
    const ownerId = randomUUID();
    const otherOwnerId = randomUUID();
    await insertUser(dataSource, ownerId, "atomic-owner@example.test");
    await insertUser(dataSource, otherOwnerId, "atomic-other@example.test");
    const document = richDocument(ownerId, randomUUID(), "Before");
    await repository.insert(ownerId, document);
    const before = await repository.findOwnedById(ownerId, document.id);

    await expect(
      repository.renameOwned(
        otherOwnerId,
        document.id,
        0,
        "Foreign",
        "2026-09-18T04:01:00.000Z",
      ),
    ).resolves.toEqual({ kind: "not-found" });
    await expect(
      repository.renameOwned(
        ownerId,
        document.id,
        99,
        "Stale",
        "2026-09-18T04:02:00.000Z",
      ),
    ).resolves.toEqual({ kind: "conflict" });
    expect(await repository.findOwnedById(ownerId, document.id)).toEqual(before);

    const results = await Promise.all([
      repository.renameOwned(
        ownerId,
        document.id,
        0,
        "Writer A",
        "2026-09-18T04:03:00.000Z",
      ),
      repository.renameOwned(
        ownerId,
        document.id,
        0,
        "Writer B",
        "2026-09-18T04:04:00.000Z",
      ),
    ]);

    expect(results.map((result) => result.kind).sort()).toEqual(["conflict", "updated"]);
    const current = await repository.findOwnedById(ownerId, document.id);
    expect(current?.revision).toBe(1);
    expect(["Writer A", "Writer B"]).toContain(current?.name);
  });
});

async function insertUser(dataSource: DataSource, id: string, email: string): Promise<void> {
  await dataSource.query(
    `INSERT INTO "users" ("id", "email", "password_hash", "first_name", "last_name")
     VALUES ($1, $2, $3, $4, $5)`,
    [id, email, "test-password-hash", "Test", "Owner"],
  );
}

function richDocument(
  ownerId: string,
  projectId: string,
  name = "Cross-layer UML project",
): ProjectDocument {
  const packageId = randomUUID();
  const classId = randomUUID();
  const enumerationId = randomUUID();
  const base = createProjectDocument({
    name,
    ownerId,
    idFactory: () => projectId,
    clock: () => new Date(FIXED_TIME),
  });

  return {
    ...base,
    uml: {
      packages: [{ kind: "package", id: packageId, name: "Domain" }],
      classes: [
        {
          kind: "class",
          id: classId,
          name: "User",
          packageId,
          attributes: [],
          operations: [],
        },
      ],
      enumerations: [
        {
          kind: "enumeration",
          id: enumerationId,
          name: "Role",
          packageId,
          literals: [],
        },
      ],
      associations: [],
      generalizations: [],
    },
    layout: {
      nodes: [
        { elementId: packageId, x: 40, y: 40 },
        { elementId: classId, x: 160, y: 120 },
        { elementId: enumerationId, x: 420, y: 120 },
      ],
    },
    generationProfile: {
      classes: [{ classId, entity: true, crud: true }],
      attributes: [],
      defaultSort: [],
    },
  };
}
