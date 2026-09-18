import { describe, expect, it } from "vitest";

import {
  createProjectDocument,
  UmlCommandBus,
} from "@primer-parcial/uml-domain";

import {
  createUmlWorkspaceAdapter,
  type UmlWorkspaceAdapter,
} from "../src/uml-workspace/uml-workspace-adapter";
import {
  createWorkspaceController,
  createWorkspaceSession,
} from "../src/uml-workspace/workspace-controller";
import {
  buildRecordingSession,
  buildStubAdapter,
  deterministicIds,
} from "./workspace-helpers";

const ownerId = "00000000-0000-4000-8000-000000000001";
const documentId = "00000000-0000-4000-8000-000000000002";
const packageOneId = "00000000-0000-4000-8000-000000000003";
const packageTwoId = "00000000-0000-4000-8000-000000000004";
const classOneId = "00000000-0000-4000-8000-000000000005";
const createController = () => {
  const document = createProjectDocument({
    name: "Workspace test",
    ownerId,
    idFactory: () => documentId,
    clock: () => new Date("2026-09-17T00:00:00.000Z"),
  });
  return createWorkspaceController({
    adapter: createUmlWorkspaceAdapter(new UmlCommandBus(document)),
  });
};

const createPackage = (id: string, name = "Domain") => ({
  kind: "CreatePackage" as const,
  parentPackageId: null,
  value: { id, name },
});

const createClass = (id: string, packageId: string) => ({
  kind: "CreateClass" as const,
  packageId,
  value: { id, name: "User" },
});

describe("workspace controller", () => {
  it("starts with the bus document and no transient state or history", () => {
    const controller = createController();

    expect(controller.state).toMatchObject({
      currentDocument: { id: documentId, ownerId, revision: 0 },
      selectedElementId: null,
      activePackageId: null,
      dragPreview: null,
      error: null,
      canUndo: false,
      canRedo: false,
    });
  });

  it("selects only diagrammable nodes, clears explicitly, and keeps package context current", () => {
    const controller = createController();
    controller.submit(createPackage(packageOneId));
    controller.submit(createClass(classOneId, packageOneId));

    controller.select(packageOneId);
    expect(controller.state).toMatchObject({
      selectedElementId: packageOneId,
      activePackageId: packageOneId,
    });

    controller.select(classOneId);
    expect(controller.state).toMatchObject({
      selectedElementId: classOneId,
      activePackageId: null,
    });

    controller.select("missing");
    expect(controller.state.selectedElementId).toBe(classOneId);
    controller.select(null);
    expect(controller.state).toMatchObject({ selectedElementId: null, activePackageId: null });
  });

  it("maps rejected submits without changing the confirmed document, selection, or history", () => {
    const controller = createController();
    controller.submit(createPackage(packageOneId));
    controller.select(packageOneId);
    const before = controller.state;

    controller.submit(createPackage(packageOneId, "Duplicate"));

    expect(controller.state.currentDocument).toEqual(before.currentDocument);
    expect(controller.state.selectedElementId).toBe(packageOneId);
    expect(controller.state.canUndo).toBe(before.canUndo);
    expect(controller.state.error).toEqual({
      kind: "precondition-failed",
      code: "DUPLICATE_ID",
    });
  });

  it("clears rejection feedback only after an accepted command and reflects bus history", () => {
    const controller = createController();
    controller.submit(createPackage(packageOneId));
    controller.submit(createPackage(packageOneId));
    expect(controller.state.error).not.toBeNull();

    controller.submit(createPackage(packageTwoId, "Application"));

    expect(controller.state).toMatchObject({
      error: null,
      canUndo: true,
      canRedo: false,
      currentDocument: { revision: 2 },
    });
  });

  it("retains the domain's unsupported and validation error contracts verbatim", () => {
    const controller = createController();

    controller.submit({ kind: "Unknown" } as unknown as Parameters<typeof controller.submit>[0]);
    expect(controller.state.error).toEqual({ kind: "unsupported-command" });

    const validationAdapter: UmlWorkspaceAdapter = {
      currentDocument: controller.state.currentDocument,
      canUndo: false,
      canRedo: false,
      submit: () => ({
        kind: "rejected",
        error: {
          kind: "validation-failed",
          diagnostics: [{
            severity: "error",
            code: "UML_NAME_REQUIRED",
            message: "Class name is required.",
            path: "uml.classes[0].name",
            elementId: classOneId,
          }],
        },
      }),
      undo: () => ({ kind: "unavailable", operation: "undo" }),
      redo: () => ({ kind: "unavailable", operation: "redo" }),
    };
    const invalidController = createWorkspaceController({
      adapter: validationAdapter,
    });

    invalidController.submit(createPackage(packageOneId));
    expect(invalidController.state.error).toMatchObject({ kind: "validation-failed" });
    expect(invalidController.state.error).toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ code: "UML_NAME_REQUIRED" }),
      ]),
    });
  });

  it("reconciles selection and package context after undo and redo while unavailable history is inert", () => {
    const controller = createController();
    controller.undo();
    expect(controller.state.currentDocument.revision).toBe(0);

    controller.submit(createPackage(packageOneId));
    controller.select(packageOneId);
    controller.undo();
    expect(controller.state).toMatchObject({
      selectedElementId: null,
      activePackageId: null,
      canUndo: false,
      canRedo: true,
    });

    controller.redo();
    expect(controller.state).toMatchObject({
      selectedElementId: null,
      activePackageId: null,
      canUndo: true,
      canRedo: false,
    });
  });

  it("uses injected session IDs and loses accepted edits on a new session", () => {
    const ids = [
      "00000000-0000-4000-8000-000000000006",
      "00000000-0000-4000-8000-000000000007",
    ];
    const idFactory = () => ids.shift()!;
    const first = createWorkspaceSession({
      ownerId,
      idFactory,
    });
    first.submit(createPackage(packageOneId));
    const remounted = createWorkspaceSession({
      ownerId,
      idFactory,
    });

    expect(first.state.currentDocument.id).toBe("00000000-0000-4000-8000-000000000006");
    expect(remounted.state.currentDocument).toMatchObject({
      id: "00000000-0000-4000-8000-000000000007",
      ownerId,
      revision: 0,
      uml: { packages: [] },
    });
  });

  it("uses stable fallback geometry, layout priority, and never changes the bus document", () => {
    const controller = createController();
    const packageZId = "00000000-0000-4000-8000-000000000009";
    const packageAId = "00000000-0000-4000-8000-000000000008";
    controller.submit(createPackage(packageZId, "Z"));
    controller.submit(createPackage(packageAId, "A"));
    const before = controller.state.currentDocument;

    expect(controller.resolvePosition(packageAId)).toEqual({ x: 80, y: 80 });
    expect(controller.resolvePosition(packageZId)).toEqual({ x: 320, y: 80 });
    expect(controller.resolvePosition(packageAId)).toEqual({ x: 80, y: 80 });
    expect(controller.resolvePosition("missing")).toBeNull();
    expect(controller.state.currentDocument).toEqual(before);

    controller.submit({ kind: "MoveNode", elementId: packageAId, x: 12, y: 34 });
    expect(controller.resolvePosition(packageAId)).toEqual({ x: 12, y: 34 });
  });

  it("re-reads the confirmed projection from currentDocument after an accepted submit and a rejection retains the prior projection", () => {
    const controller = createController();
    controller.submit(createPackage(packageOneId));
    controller.select(packageOneId);
    const before = controller.state.currentDocument;

    controller.submit(createClass(classOneId, packageOneId));

    expect(controller.state.currentDocument).not.toBe(before);
    expect(controller.state).toMatchObject({
      currentDocument: { revision: 2 },
      selectedElementId: packageOneId,
      activePackageId: packageOneId,
      error: null,
    });
    expect(
      controller.state.currentDocument.uml.classes.some((item) => item.id === classOneId),
    ).toBe(true);

    const accepted = controller.state.currentDocument;
    controller.submit(createClass(classOneId, packageOneId));

    expect(controller.state.currentDocument).toEqual(accepted);
    expect(controller.state).toMatchObject({
      selectedElementId: packageOneId,
      activePackageId: packageOneId,
      error: { kind: "precondition-failed", code: "DUPLICATE_ID" },
    });
    expect(controller.resolvePosition(packageOneId)).toEqual({ x: 80, y: 80 });
  });
});

describe("workspace drag preview (Block 5.1)", () => {
  it("previews without mutating the document and commits exactly one MoveNode on end", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([packageOneId, classOneId]),
    );
    controller.submit(createPackage(packageOneId));
    controller.submit(createClass(classOneId, packageOneId));
    const revisionBefore = controller.state.currentDocument.revision;

    controller.beginDrag(classOneId, { x: 320, y: 80 });
    controller.updateDrag({ x: 340, y: 100 });
    controller.updateDrag({ x: 350, y: 120 });

    expect(controller.state.dragPreview).toEqual({
      elementId: classOneId,
      position: { x: 350, y: 120 },
    });
    expect(controller.state.currentDocument.revision).toBe(revisionBefore);
    expect(controller.resolvePosition(classOneId)).toEqual({ x: 320, y: 80 });
    expect(commands).toHaveLength(2);

    controller.endDrag();

    expect(commands).toHaveLength(3);
    expect(commands[2]).toEqual({
      kind: "MoveNode",
      elementId: classOneId,
      x: 350,
      y: 120,
    });
    expect(controller.state.dragPreview).toBeNull();
    expect(controller.resolvePosition(classOneId)).toEqual({ x: 350, y: 120 });
    expect(controller.state.currentDocument.revision).toBe(revisionBefore + 1);
    expect(controller.state).toMatchObject({ error: null, canUndo: true, canRedo: false });
  });

  it("treats a drag that ends on its starting position as a no-op", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([packageOneId, classOneId]),
    );
    controller.submit(createPackage(packageOneId));
    controller.submit(createClass(classOneId, packageOneId));
    const revisionBefore = controller.state.currentDocument.revision;

    controller.beginDrag(classOneId, { x: 320, y: 80 });
    controller.updateDrag({ x: 320, y: 80 });
    controller.endDrag();

    expect(commands).toHaveLength(2);
    expect(controller.state.dragPreview).toBeNull();
    expect(controller.state.currentDocument.revision).toBe(revisionBefore);
    expect(controller.resolvePosition(classOneId)).toEqual({ x: 320, y: 80 });
  });

  it("keeps relation anchors unchanged across every drag preview update", () => {
    const controller = createController();
    controller.submit(createPackage(packageOneId));
    controller.submit(createClass(classOneId, packageOneId));
    const anchors = new Map([
      [
        "relation-id",
        {
          side: "from" as const,
          endpoint: { x: 10, y: 20 },
          boundary: { x: 30, y: 40 },
          lanePerpendicular: { x: 0, y: 1 },
        },
      ],
    ]);

    controller.beginDrag(classOneId, { x: 320, y: 80 }, anchors);
    controller.updateDrag({ x: 340, y: 100 });
    expect(controller.state.dragPreview?.relationAnchors).toBe(anchors);

    controller.updateDrag({ x: 360, y: 120 });
    expect(controller.state.dragPreview).toEqual({
      elementId: classOneId,
      position: { x: 360, y: 120 },
      relationAnchors: anchors,
    });
  });

  it("discards the preview on cancel without committing and guarantees a single active drag", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([packageOneId, classOneId, packageTwoId]),
    );
    controller.submit(createPackage(packageOneId));
    controller.submit(createClass(classOneId, packageOneId));

    controller.beginDrag(classOneId, { x: 320, y: 80 });
    controller.beginDrag(classOneId, { x: 10, y: 10 });
    expect(controller.state.dragPreview).toEqual({
      elementId: classOneId,
      position: { x: 320, y: 80 },
    });

    controller.updateDrag({ x: 400, y: 200 });
    controller.cancelDrag();

    expect(controller.state.dragPreview).toBeNull();
    expect(commands).toHaveLength(2);
    expect(controller.resolvePosition(classOneId)).toEqual({ x: 320, y: 80 });

    controller.beginDrag("missing", { x: 80, y: 80 });
    expect(controller.state.dragPreview).toBeNull();
  });

  it("maps a rejected MoveNode on end to typed feedback and clears the preview", () => {
    const bus = new UmlCommandBus(
      createProjectDocument({
        name: "Reject",
        ownerId,
        idFactory: () => documentId,
        clock: () => new Date("2026-09-17T00:00:00.000Z"),
      }),
    );
    bus.submit(createPackage(packageOneId));
    bus.submit(createClass(classOneId, packageOneId));
    const document = bus.currentDocument;
    const controller = createWorkspaceController({
      adapter: buildStubAdapter(document, {
        kind: "rejected",
        error: { kind: "precondition-failed", code: "TARGET_NOT_FOUND" },
      }),
    });

    controller.beginDrag(classOneId, { x: 320, y: 80 });
    controller.updateDrag({ x: 350, y: 80 });
    controller.endDrag();

    expect(controller.state.currentDocument).toEqual(document);
    expect(controller.state.dragPreview).toBeNull();
    expect(controller.state.error).toEqual({
      kind: "precondition-failed",
      code: "TARGET_NOT_FOUND",
    });
    expect(controller.resolvePosition(classOneId)).toEqual({ x: 320, y: 80 });
  });

  it("clears an active drag preview when undo or redo restores a snapshot", () => {
    const { controller } = buildRecordingSession(
      deterministicIds([packageOneId, classOneId]),
    );
    controller.submit(createPackage(packageOneId));
    controller.submit(createClass(classOneId, packageOneId));

    controller.beginDrag(classOneId, { x: 320, y: 80 });
    controller.updateDrag({ x: 360, y: 120 });
    expect(controller.state.dragPreview).not.toBeNull();

    controller.undo();

    expect(controller.state.dragPreview).toBeNull();
    expect(controller.state.error).toBeNull();
    expect(controller.state.canUndo).toBe(true);
    expect(controller.state.canRedo).toBe(true);

    controller.beginDrag(classOneId, { x: 320, y: 80 });
    controller.updateDrag({ x: 340, y: 100 });
    controller.redo();

    expect(controller.state.dragPreview).toBeNull();
  });
});
