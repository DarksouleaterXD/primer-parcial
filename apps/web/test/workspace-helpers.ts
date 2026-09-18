import {
  createProjectDocument,
  multiplicity,
  primitiveType,
  UmlCommandBus,
  type ProjectDocument,
  type UmlCommand,
  type UmlCommandResult,
} from "@primer-parcial/uml-domain";

import {
  createUmlWorkspaceAdapter,
  type UmlWorkspaceAdapter,
} from "../src/uml-workspace/uml-workspace-adapter";
import {
  createWorkspaceController,
  type WorkspaceController,
  type WorkspaceIdFactory,
} from "../src/uml-workspace/workspace-controller";

export const ownerId = "00000000-0000-4000-8000-000000000001";

export const buildRecordingSession = (
  idFactory: WorkspaceIdFactory,
): { readonly controller: WorkspaceController; readonly commands: UmlCommand[] } => {
  const commands: UmlCommand[] = [];
  const document = createProjectDocument({
    name: "Recording workspace test",
    ownerId,
    idFactory: () => "00000000-0000-4000-8000-0000000000ff",
    clock: () => new Date("2026-09-17T00:00:00.000Z"),
  });
  const bus = new UmlCommandBus(document);
  const adapter: UmlWorkspaceAdapter = {
    get currentDocument() {
      return bus.currentDocument;
    },
    get canUndo() {
      return bus.canUndo;
    },
    get canRedo() {
      return bus.canRedo;
    },
    submit(command) {
      commands.push(command);
      return bus.submit(command);
    },
    undo() {
      return bus.undo();
    },
    redo() {
      return bus.redo();
    },
  };
  return { controller: createWorkspaceController({ adapter, idFactory }), commands };
};

export const buildStubAdapter = (
  document: ProjectDocument,
  result: UmlCommandResult,
): UmlWorkspaceAdapter => ({
  currentDocument: document,
  canUndo: false,
  canRedo: false,
  submit: () => result,
  undo: () => ({ kind: "unavailable", operation: "undo" }),
  redo: () => ({ kind: "unavailable", operation: "redo" }),
});

export const deterministicIds = (
  values: readonly string[],
): WorkspaceIdFactory => {
  const queue = [...values];
  return () => {
    const next = queue.shift();
    if (next === undefined) {
      throw new Error("deterministicIds exhausted");
    }
    return next;
  };
};

export interface RichController {
  readonly controller: WorkspaceController;
  readonly ids: {
    readonly documentId: string;
    readonly pkgId: string;
    readonly classId: string;
    readonly otherClassId: string;
    readonly enumId: string;
  };
}

export const buildRichController = (): RichController => {
  const ids = {
    documentId: "00000000-0000-4000-8000-000000000002",
    pkgId: "00000000-0000-4000-8000-000000000003",
    classId: "00000000-0000-4000-8000-000000000004",
    otherClassId: "00000000-0000-4000-8000-000000000005",
    enumId: "00000000-0000-4000-8000-000000000006",
  };
  const bus = new UmlCommandBus(
    createProjectDocument({
      name: "Rich workspace test",
      ownerId,
      idFactory: () => ids.documentId,
      clock: () => new Date("2026-09-17T00:00:00.000Z"),
    }),
  );
  const controller = createWorkspaceController({
    adapter: createUmlWorkspaceAdapter(bus),
  });

  controller.submit({
    kind: "CreatePackage",
    parentPackageId: null,
    value: { id: ids.pkgId, name: "Domain" },
  });
  controller.submit({
    kind: "CreateClass",
    packageId: ids.pkgId,
    value: { id: ids.classId, name: "User" },
  });
  controller.submit({
    kind: "AddAttribute",
    classId: ids.classId,
    value: {
      id: "00000000-0000-4000-8000-000000000007",
      name: "email",
      visibility: "public",
      type: primitiveType("string"),
      multiplicity: multiplicity(1, 1),
    },
  });
  controller.submit({
    kind: "AddOperation",
    classId: ids.classId,
    value: {
      id: "00000000-0000-4000-8000-000000000008",
      name: "signIn",
      visibility: "public",
      parameters: [],
      returnType: primitiveType("boolean"),
    },
  });
  controller.submit({
    kind: "CreateClass",
    packageId: ids.pkgId,
    value: { id: ids.otherClassId, name: "Profile" },
  });
  controller.submit({
    kind: "CreateEnumeration",
    packageId: ids.pkgId,
    value: { id: ids.enumId, name: "Role" },
  });
  controller.submit({
    kind: "AddEnumerationLiteral",
    enumerationId: ids.enumId,
    value: { id: "00000000-0000-4000-8000-000000000009", name: "ADMIN" },
  });
  controller.submit({
    kind: "AddEnumerationLiteral",
    enumerationId: ids.enumId,
    value: { id: "00000000-0000-4000-8000-000000000010", name: "USER" },
  });
  controller.submit({
    kind: "CreateAssociation",
    value: {
      id: "00000000-0000-4000-8000-000000000011",
      name: "owns",
      ends: [
        {
          id: "00000000-0000-4000-8000-000000000012",
          classifierId: ids.classId,
          roleName: "owner",
          multiplicity: multiplicity(1, 1),
          aggregation: "none",
        },
        {
          id: "00000000-0000-4000-8000-000000000013",
          classifierId: ids.otherClassId,
          multiplicity: multiplicity(0, "*"),
          aggregation: "none",
        },
      ],
    },
  });
  controller.submit({
    kind: "CreateGeneralization",
    value: {
      id: "00000000-0000-4000-8000-000000000014",
      specificId: ids.classId,
      generalId: ids.otherClassId,
    },
  });

  return { controller, ids };
};