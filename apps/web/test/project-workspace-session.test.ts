import { describe, expect, it } from "vitest";

import type { ProjectList, ProjectSnapshot } from "@primer-parcial/contracts";
import {
  createProjectDocument,
  parseProjectDocument,
  serializeProjectDocument,
  type ProjectDocument,
} from "@primer-parcial/uml-domain";

import {
  type ProjectRepository,
  type ProjectRepositoryResult,
  type ProjectSaveRequest,
} from "../src/projects/project-repository";
import {
  createDurableWorkspaceSession,
  reopenDurableWorkspaceSession,
} from "../src/projects/project-workspace-session";

const projectId = "20000000-0000-4000-8000-000000000001";
const ownerId = "20000000-0000-4000-8000-000000000002";
const packageId = "20000000-0000-4000-8000-000000000003";
const createdAt = "2026-09-18T02:00:00.000Z";

const initialDocument = (): ProjectDocument => createProjectDocument({
  name: "Persisted UML",
  ownerId,
  idFactory: () => projectId,
  clock: () => new Date(createdAt),
});

const snapshotOf = (document: ProjectDocument): ProjectSnapshot => ({
  id: document.id,
  name: document.name,
  revision: document.revision,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
  document,
});

const unavailable = async <T>(): Promise<ProjectRepositoryResult<T>> => ({
  kind: "error",
  error: { kind: "unavailable" },
});

const repositoryWith = (overrides: Partial<ProjectRepository>): ProjectRepository => ({
  create: overrides.create ?? (() => unavailable<ProjectSnapshot>()),
  list: overrides.list ?? (() => unavailable<ProjectList>()),
  get: overrides.get ?? (() => unavailable<ProjectSnapshot>()),
  reopenProject: overrides.reopenProject ?? (() => unavailable<ProjectSnapshot>()),
  rename: overrides.rename ?? (() => unavailable<ProjectSnapshot>()),
  save: overrides.save ?? (() => unavailable<ProjectSnapshot>()),
  delete: overrides.delete ?? (() => unavailable<undefined>()),
});

describe("durable workspace session seam", () => {
  it("creates and reopens a fresh local UmlCommandBus only after a canonical API snapshot", async () => {
    const snapshot = snapshotOf(initialDocument());
    const repository = repositoryWith({
      create: async () => ({ kind: "success", data: snapshot }),
      reopenProject: async () => ({ kind: "success", data: snapshot }),
    });

    const created = await createDurableWorkspaceSession(repository, "Persisted UML");
    const reopened = await reopenDurableWorkspaceSession(repository, projectId);
    expect(created.kind).toBe("ready");
    expect(reopened.kind).toBe("ready");
    if (created.kind !== "ready" || reopened.kind !== "ready") {
      throw new Error("Expected ready sessions.");
    }

    expect(created.session.controller).not.toBe(reopened.session.controller);
    expect(created.session.controller.state.currentDocument).toEqual(snapshot.document);
    expect(reopened.session.controller.state.currentDocument).toEqual(snapshot.document);

    expect(created.session.controller.submit({
      kind: "CreatePackage",
      parentPackageId: null,
      value: { id: packageId, name: "Domain" },
    })).toBe(true);
    expect(created.session.controller.state.currentDocument.uml.packages).toHaveLength(1);
    expect(reopened.session.controller.state.currentDocument.uml.packages).toHaveLength(0);
  });

  it("saves explicitly using the last accepted durable revision while preserving local command history", async () => {
    const initial = snapshotOf(initialDocument());
    const saveCalls: Array<{ readonly projectId: string; readonly request: ProjectSaveRequest }> = [];
    const repository = repositoryWith({
      reopenProject: async () => ({ kind: "success", data: initial }),
      save: async (id, request) => {
        saveCalls.push({ projectId: id, request });
        const savedDocument = parseProjectDocument(serializeProjectDocument({
          ...request.document,
          revision: request.expectedRevision + 1,
          updatedAt: "2026-09-18T02:05:00.000Z",
        }));
        return { kind: "success", data: snapshotOf(savedDocument) };
      },
    });

    const opened = await reopenDurableWorkspaceSession(repository, projectId);
    if (opened.kind !== "ready") {
      throw new Error("Expected ready session.");
    }
    const { session } = opened;

    expect(session.controller.submit({
      kind: "CreatePackage",
      parentPackageId: null,
      value: { id: packageId, name: "Domain" },
    })).toBe(true);
    expect(session.controller.submit({ kind: "RenamePackage", packageId, name: "Domain Model" })).toBe(true);

    expect(session.controller.state.currentDocument.revision).toBe(2);
    expect(session.durableRevision).toBe(0);
    expect(saveCalls).toHaveLength(0);

    const result = await session.save();
    expect(result.kind).toBe("saved");
    expect(saveCalls).toHaveLength(1);
    expect(saveCalls[0].projectId).toBe(projectId);
    expect(saveCalls[0].request.expectedRevision).toBe(0);
    expect(saveCalls[0].request.document.revision).toBe(0);
    expect(saveCalls[0].request.document.createdAt).toBe(initial.createdAt);
    expect(saveCalls[0].request.document.updatedAt).toBe(initial.updatedAt);
    expect(saveCalls[0].request.document.uml.packages[0]?.name).toBe("Domain Model");

    expect(session.durableRevision).toBe(1);
    expect(session.controller.state.currentDocument.revision).toBe(2);
    expect(session.controller.state.canUndo).toBe(true);
  });

  it("keeps 404 and 409 as explicit UX outcomes without merge, reload or overwrite", async () => {
    for (const kind of ["not-found", "conflict"] as const) {
      let saveCount = 0;
      let reopenCount = 0;
      const initial = snapshotOf(initialDocument());
      const repository = repositoryWith({
        reopenProject: async () => {
          reopenCount += 1;
          return { kind: "success", data: initial };
        },
        save: async () => {
          saveCount += 1;
          return { kind: "error", error: { kind } };
        },
      });

      const opened = await reopenDurableWorkspaceSession(repository, projectId);
      if (opened.kind !== "ready") {
        throw new Error("Expected ready session.");
      }
      const { session } = opened;
      expect(session.controller.submit({
        kind: "CreatePackage",
        parentPackageId: null,
        value: { id: packageId, name: "Domain" },
      })).toBe(true);
      const localBefore = session.controller.state.currentDocument;

      const result = await session.save();
      expect(result.kind).toBe(kind);
      expect(result).toHaveProperty("message");
      expect(session.durableRevision).toBe(0);
      expect(session.controller.state.currentDocument).toEqual(localBefore);
      expect(saveCount).toBe(1);
      expect(reopenCount).toBe(1);
    }
  });

  it("never autosaves on commands, undo or redo", async () => {
    let saveCount = 0;
    const initial = snapshotOf(initialDocument());
    const repository = repositoryWith({
      reopenProject: async () => ({ kind: "success", data: initial }),
      save: async () => {
        saveCount += 1;
        return unavailable<ProjectSnapshot>();
      },
    });

    const opened = await reopenDurableWorkspaceSession(repository, projectId);
    if (opened.kind !== "ready") {
      throw new Error("Expected ready session.");
    }
    const { controller } = opened.session;
    controller.submit({
      kind: "CreatePackage",
      parentPackageId: null,
      value: { id: packageId, name: "Domain" },
    });
    controller.undo();
    controller.redo();

    expect(saveCount).toBe(0);
  });
});
