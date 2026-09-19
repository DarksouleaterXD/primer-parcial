import { describe, expect, it } from "vitest";

import {
  createProjectSchema,
  deleteProjectSchema,
  projectRevisionConflictSchema,
  projectSnapshotSchema,
  renameProjectSchema,
  saveProjectDocumentSchema,
} from "../src/index.js";

describe("project persistence contracts", () => {
  it("keeps create strict and rejects client-controlled ownership", () => {
    expect(createProjectSchema.parse({ name: "  Modelo  " })).toEqual({ name: "Modelo" });
    expect(createProjectSchema.safeParse({ name: "Modelo", ownerId: crypto.randomUUID() }).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("requires non-negative integer expectedRevision on every mutation envelope", () => {
    expect(renameProjectSchema.safeParse({ name: "Renamed", expectedRevision: 0 }).success).toBe(true);
    expect(saveProjectDocumentSchema.safeParse({ document: {}, expectedRevision: 2 }).success).toBe(true);
    expect(deleteProjectSchema.safeParse({ expectedRevision: 3 }).success).toBe(true);
    expect(renameProjectSchema.safeParse({ name: "Renamed", expectedRevision: -1 }).success).toBe(false);
    expect(deleteProjectSchema.safeParse({ expectedRevision: 1.5 }).success).toBe(false);
  });

  it("keeps ProjectSnapshot strict without duplicating the UML runtime schema", () => {
    const value = {
      id: crypto.randomUUID(),
      name: "Project",
      revision: 0,
      createdAt: "2026-09-17T20:00:00.000Z",
      updatedAt: "2026-09-17T20:00:00.000Z",
      document: { opaqueToContracts: true },
    };
    expect(projectSnapshotSchema.parse(value)).toEqual(value);
    expect(projectSnapshotSchema.safeParse({ ...value, ownerId: crypto.randomUUID() }).success).toBe(false);
  });

  it("keeps the public conflict body closed and free of server state", () => {
    expect(projectRevisionConflictSchema.parse({ code: "PROJECT_REVISION_CONFLICT" })).toEqual({
      code: "PROJECT_REVISION_CONFLICT",
    });
    expect(
      projectRevisionConflictSchema.safeParse({
        code: "PROJECT_REVISION_CONFLICT",
        revision: 7,
      }).success,
    ).toBe(false);
  });
});
