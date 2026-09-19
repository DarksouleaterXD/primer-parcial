import { randomUUID } from "node:crypto";

import {
  createProjectDocument,
  type ProjectDocument,
} from "@primer-parcial/uml-domain";
import type { DataSource } from "typeorm";

import {
  ProjectStorageError,
  UmlProjectRepository,
} from "../src/projects/uml-project.repository.js";
import {
  createTestDataSource,
  prepareTestDatabase,
} from "./test-database.js";

const FIXED_TIME = "2026-09-17T20:00:00.000Z";

describe("UML project persistence", () => {
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

  test("migration creates JSONB schema, FK cascade, revision check and owner index", async () => {
    const columns = await dataSource.query<
      { column_name: string; data_type: string; is_nullable: string }[]
    >(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'uml_projects'
    `);
    const byName = new Map(columns.map((column) => [column.column_name, column]));

    expect(byName.get("id")).toMatchObject({ data_type: "uuid", is_nullable: "NO" });
    expect(byName.get("owner_id")).toMatchObject({ data_type: "uuid", is_nullable: "NO" });
    expect(byName.get("name")).toMatchObject({ data_type: "character varying", is_nullable: "NO" });
    expect(byName.get("revision")).toMatchObject({ data_type: "integer", is_nullable: "NO" });
    expect(byName.get("document")).toMatchObject({ data_type: "jsonb", is_nullable: "NO" });
    expect(byName.get("created_at")).toMatchObject({ data_type: "timestamp with time zone", is_nullable: "NO" });
    expect(byName.get("updated_at")).toMatchObject({ data_type: "timestamp with time zone", is_nullable: "NO" });

    const constraints = await dataSource.query<{ conname: string; definition: string }[]>(`
      SELECT conname, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'uml_projects'::regclass
    `);
    const definitions = constraints.map((constraint) => constraint.definition).join("\n");
    expect(definitions).toMatch(/CHECK \(\(revision >= 0\)\)/);
    expect(definitions).toMatch(/FOREIGN KEY \(owner_id\) REFERENCES users\(id\) ON DELETE CASCADE/);

    const indexes = await dataSource.query<{ indexname: string; indexdef: string }[]>(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'uml_projects'
    `);
    const ownerIndex = indexes.find((index) => index.indexname === "IDX_uml_projects_owner_updated_id");
    expect(ownerIndex?.indexdef).toContain("owner_id");
    expect(ownerIndex?.indexdef).toContain("updated_at DESC");
    expect(ownerIndex?.indexdef).toContain("id");
  });

  test("round-trips the canonical ProjectDocument through JSONB without losing model, layout or profile", async () => {
    const ownerId = randomUUID();
    await insertUser(dataSource, ownerId, "roundtrip@example.test");
    const document = richDocument(ownerId, randomUUID());

    const inserted = await repository.insert(ownerId, document);
    const reopened = await repository.findOwnedById(ownerId, document.id);

    expect(inserted).toEqual(document);
    expect(reopened).toEqual(document);
    expect(reopened?.uml).toEqual(document.uml);
    expect(reopened?.layout).toEqual(document.layout);
    expect(reopened?.generationProfile).toEqual(document.generationProfile);
  });

  test("lists only the requested owner's project metadata", async () => {
    const ownerA = randomUUID();
    const ownerB = randomUUID();
    await insertUser(dataSource, ownerA, "owner-a@example.test");
    await insertUser(dataSource, ownerB, "owner-b@example.test");

    const documentA = richDocument(ownerA, randomUUID(), "A project");
    const documentB = richDocument(ownerB, randomUUID(), "B project");
    await repository.insert(ownerA, documentA);
    await repository.insert(ownerB, documentB);

    const listed = await repository.listOwned(ownerA);

    expect(listed).toEqual([
      {
        id: documentA.id,
        name: documentA.name,
        revision: documentA.revision,
        createdAt: documentA.createdAt,
        updatedAt: documentA.updatedAt,
      },
    ]);
    expect(JSON.stringify(listed)).not.toContain(documentB.id);
    expect(JSON.stringify(listed)).not.toContain("uml");
  });

  test("enforces owner FK and exposes only a safe storage error", async () => {
    const missingOwner = randomUUID();
    const document = richDocument(missingOwner, randomUUID());

    let caught: unknown;
    try {
      await repository.insert(missingOwner, document);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ProjectStorageError);
    expect(caught).toMatchObject({ code: "PROJECT_STORAGE_FAILURE" });
    expect((caught as Error).message).toBe("Project storage operation failed.");
    expect((caught as Error).message).not.toMatch(/foreign|constraint|postgres|uml_projects/i);
  });

  test("cascades project deletion when its owning user is deleted", async () => {
    const ownerId = randomUUID();
    await insertUser(dataSource, ownerId, "cascade@example.test");
    const document = richDocument(ownerId, randomUUID());
    await repository.insert(ownerId, document);

    await dataSource.query('DELETE FROM "users" WHERE "id" = $1', [ownerId]);
    const rows = await dataSource.query<{ count: string }[]>(
      'SELECT count(*)::text AS count FROM "uml_projects" WHERE "id" = $1',
      [document.id],
    );

    expect(rows[0]?.count).toBe("0");
  });

  test("rejects corrupt stored JSONB with a safe adapter error", async () => {
    const ownerId = randomUUID();
    await insertUser(dataSource, ownerId, "corrupt@example.test");
    const document = richDocument(ownerId, randomUUID());
    await repository.insert(ownerId, document);

    await dataSource.query(
      'UPDATE "uml_projects" SET "document" = $1::jsonb WHERE "id" = $2',
      [JSON.stringify({ schemaVersion: 999, leaked: "must-not-escape" }), document.id],
    );

    let caught: unknown;
    try {
      await repository.findOwnedById(ownerId, document.id);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ProjectStorageError);
    expect(caught).toMatchObject({ code: "PROJECT_STORAGE_CORRUPT" });
    expect((caught as Error).message).toBe("Stored project data is invalid.");
    expect((caught as Error).message).not.toContain("must-not-escape");
    expect(caught).not.toHaveProperty("document");
  });

  test("conditional rename classifies stale and missing rows without leaking foreign state", async () => {
    const ownerId = randomUUID();
    const otherOwner = randomUUID();
    await insertUser(dataSource, ownerId, "conditional-owner@example.test");
    await insertUser(dataSource, otherOwner, "conditional-other@example.test");
    const document = richDocument(ownerId, randomUUID(), "Before");
    await repository.insert(ownerId, document);

    const updated = await repository.renameOwned(ownerId, document.id, 0, "After", "2026-09-17T20:01:00.000Z");
    expect(updated).toMatchObject({ kind: "updated", document: { name: "After", revision: 1 } });

    await expect(repository.renameOwned(ownerId, document.id, 0, "Stale", "2026-09-17T20:02:00.000Z")).resolves.toEqual({ kind: "conflict" });
    await expect(repository.renameOwned(otherOwner, document.id, 1, "Foreign", "2026-09-17T20:03:00.000Z")).resolves.toEqual({ kind: "not-found" });
  });

  test("allows exactly one concurrent conditional rename for the same revision", async () => {
    const ownerId = randomUUID();
    await insertUser(dataSource, ownerId, "concurrent-repo@example.test");
    const document = richDocument(ownerId, randomUUID(), "Concurrent");
    await repository.insert(ownerId, document);

    const results = await Promise.all([
      repository.renameOwned(ownerId, document.id, 0, "A", "2026-09-17T20:01:00.000Z"),
      repository.renameOwned(ownerId, document.id, 0, "B", "2026-09-17T20:01:01.000Z"),
    ]);

    expect(results.map((result) => result.kind).sort()).toEqual(["conflict", "updated"]);
    const current = await repository.findOwnedById(ownerId, document.id);
    expect(current?.revision).toBe(1);
    expect(["A", "B"]).toContain(current?.name);
  });

  test("rolls back a conditional rename when post-update canonical parsing fails", async () => {
    const ownerId = randomUUID();
    await insertUser(dataSource, ownerId, "rollback@example.test");
    const document = richDocument(ownerId, randomUUID(), "Before rollback");
    await repository.insert(ownerId, document);

    await dataSource.query(
      'UPDATE "uml_projects" SET "document" = $1::jsonb WHERE "id" = $2',
      [JSON.stringify({ schemaVersion: 999 }), document.id],
    );

    await expect(
      repository.renameOwned(ownerId, document.id, 0, "Must rollback", "2026-09-17T20:05:00.000Z"),
    ).rejects.toMatchObject({ code: "PROJECT_STORAGE_CORRUPT" });

    const rows = await dataSource.query<{ name: string; revision: number }[]>(
      'SELECT "name", "revision" FROM "uml_projects" WHERE "id" = $1',
      [document.id],
    );
    expect(rows[0]).toEqual({ name: "Before rollback", revision: 0 });
  });

});

async function insertUser(dataSource: DataSource, id: string, email: string): Promise<void> {
  await dataSource.query(
    `INSERT INTO "users" ("id", "email", "password_hash", "first_name", "last_name")
     VALUES ($1, $2, $3, $4, $5)`,
    [id, email, "test-password-hash", "Test", "Owner"],
  );
}

function richDocument(ownerId: string, projectId: string, name = "Stored UML project"): ProjectDocument {
  const packageId = randomUUID();
  const classId = randomUUID();
  const base = createProjectDocument({
    name,
    ownerId,
    idFactory: () => projectId,
    clock: () => new Date(FIXED_TIME),
  });

  return {
    ...base,
    uml: {
      packages: [
        {
          kind: "package",
          id: packageId,
          name: "Domain",
        },
      ],
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
      enumerations: [],
      associations: [],
      generalizations: [],
    },
    layout: {
      nodes: [{ elementId: classId, x: 120, y: 240 }],
    },
    generationProfile: {
      classes: [{ classId, entity: true, crud: true }],
      attributes: [],
      defaultSort: [],
    },
  };
}