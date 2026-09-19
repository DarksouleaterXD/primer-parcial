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
import { reopenDurableWorkspaceSession } from "../src/projects/project-workspace-session";

const projectId = "30000000-0000-4000-8000-000000000001";
const ownerId = "30000000-0000-4000-8000-000000000002";
const packageId = "30000000-0000-4000-8000-000000000003";
const classId = "30000000-0000-4000-8000-000000000004";
const createdAt = "2026-09-18T05:00:00.000Z";

const richDocument = (): ProjectDocument => {
  const base = createProjectDocument({
    name: "Durable workspace",
    ownerId,
    idFactory: () => projectId,
    clock: () => new Date(createdAt),
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
      enumerations: [],
      associations: [],
      generalizations: [],
    },
    layout: { nodes: [{ elementId: classId, x: 180, y: 120 }] },
    generationProfile: {
      classes: [{ classId, entity: true, crud: true }],
      attributes: [],
      defaultSort: [],
    },
  };
};

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

describe("CU-3 web persistence regression", () => {
  it("reopens the complete canonical snapshot and keeps commands plus Undo/Redo local", async () => {
    const initial = snapshotOf(richDocument());
    let saveCount = 0;
    const repository = repositoryWith({
      reopenProject: async () => ({ kind: "success", data: initial }),
      save: async () => {
        saveCount += 1;
        return unavailable<ProjectSnapshot>();
      },
    });

    const opened = await reopenDurableWorkspaceSession(repository, projectId);
    expect(opened.kind).toBe("ready");
    if (opened.kind !== "ready") {
      throw new Error("Expected ready durable workspace session.");
    }

    const { session } = opened;
    expect(session.controller.state.currentDocument).toEqual(initial.document);
    expect(session.controller.state.currentDocument.uml).toEqual(initial.document.uml);
    expect(session.controller.state.currentDocument.layout).toEqual(initial.document.layout);
    expect(session.controller.state.currentDocument.generationProfile).toEqual(
      initial.document.generationProfile,
    );

    expect(
      session.controller.submit({ kind: "RenameClass", classId, name: "Account" }),
    ).toBe(true);
    const edited = session.controller.state.currentDocument;
    expect(edited.uml.classes[0]?.name).toBe("Account");
    expect(saveCount).toBe(0);

    session.controller.undo();
    expect(session.controller.state.currentDocument).toEqual(initial.document);
    session.controller.redo();
    expect(session.controller.state.currentDocument).toEqual(edited);
    expect(saveCount).toBe(0);
  });

  it("persists only on explicit save and advances only the durable revision from the accepted snapshot", async () => {
    const initial = snapshotOf(richDocument());
    const saveCalls: ProjectSaveRequest[] = [];
    const repository = repositoryWith({
      reopenProject: async () => ({ kind: "success", data: initial }),
      save: async (_id, request) => {
        saveCalls.push(request);
        const stored = parseProjectDocument(
          serializeProjectDocument({
            ...request.document,
            revision: request.expectedRevision + 1,
            updatedAt: "2026-09-18T05:05:00.000Z",
          }),
        );
        return { kind: "success", data: snapshotOf(stored) };
      },
    });

    const opened = await reopenDurableWorkspaceSession(repository, projectId);
    if (opened.kind !== "ready") {
      throw new Error("Expected ready durable workspace session.");
    }
    const { session } = opened;

    session.controller.submit({ kind: "RenameClass", classId, name: "Account" });
    const localRevisionBeforeSave = session.controller.state.currentDocument.revision;
    expect(localRevisionBeforeSave).toBe(1);
    expect(session.durableRevision).toBe(0);

    const saved = await session.save();

    expect(saved.kind).toBe("saved");
    expect(saveCalls).toHaveLength(1);
    expect(saveCalls[0]?.expectedRevision).toBe(0);
    expect(saveCalls[0]?.document.revision).toBe(0);
    expect(saveCalls[0]?.document.uml.classes[0]?.name).toBe("Account");
    expect(saveCalls[0]?.document.layout).toEqual(initial.document.layout);
    expect(saveCalls[0]?.document.generationProfile).toEqual(initial.document.generationProfile);
    expect(session.durableRevision).toBe(1);
    expect(session.controller.state.currentDocument.revision).toBe(localRevisionBeforeSave);
    expect(session.controller.state.canUndo).toBe(true);
  });
});
