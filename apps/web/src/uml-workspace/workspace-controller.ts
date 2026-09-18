import {
  createProjectDocument,
  type ProjectDocument,
  type UmlCommand,
  type UmlCommandError,
  type UmlCommandPreconditionCode,
  type ValidationDiagnostic,
  UmlCommandBus,
} from "@primer-parcial/uml-domain";

import {
  createUmlWorkspaceAdapter,
  type UmlWorkspaceAdapter,
} from "./uml-workspace-adapter";

export type WorkspaceIdFactory = () => string;

export type WorkspaceError =
  | { readonly kind: "unsupported-command" }
  | {
      readonly kind: "precondition-failed";
      readonly code: UmlCommandPreconditionCode;
    }
  | {
      readonly kind: "validation-failed";
      readonly diagnostics: readonly ValidationDiagnostic[];
    };

export interface WorkspacePosition {
  readonly x: number;
  readonly y: number;
}

/** Preview efimero de arrastre: estado transitorio de UI, nunca muta modelo/layout/historia. */
export interface DragPreview {
  readonly elementId: string;
  readonly position: WorkspacePosition;
  readonly relationAnchors?: ReadonlyMap<string, DragRelationAnchor>;
}

/** Geometria de una relacion que permanece fija mientras el otro extremo se arrastra. */
export interface DragRelationAnchor {
  readonly side: "from" | "to";
  readonly endpoint: WorkspacePosition;
  readonly boundary: WorkspacePosition;
  readonly lanePerpendicular: WorkspacePosition;
}

export interface WorkspaceState {
  readonly currentDocument: ProjectDocument;
  readonly selectedElementId: string | null;
  readonly activePackageId: string | null;
  readonly dragPreview: DragPreview | null;
  readonly error: WorkspaceError | null;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export interface WorkspaceController {
  readonly state: WorkspaceState;
  submit(command: UmlCommand): boolean;
  select(elementId: string | null): void;
  undo(): void;
  redo(): void;
  createElementId(): string;
  dismissError(): void;
  resolvePosition(elementId: string): WorkspacePosition | null;
  beginDrag(
    elementId: string,
    position: WorkspacePosition,
    relationAnchors?: ReadonlyMap<string, DragRelationAnchor>,
  ): void;
  updateDrag(position: WorkspacePosition): void;
  cancelDrag(): void;
  endDrag(): void;
}

export interface CreateWorkspaceControllerOptions {
  readonly adapter: UmlWorkspaceAdapter;
  readonly idFactory?: WorkspaceIdFactory;
}

export interface CreateWorkspaceSessionOptions {
  readonly ownerId: string;
  readonly idFactory?: WorkspaceIdFactory;
}

const INTERNAL_DOCUMENT_NAME = "primer-parcial-workspace";
const ID_ATTEMPT_LIMIT = 1000;

const defaultIdFactory: WorkspaceIdFactory = () => globalThis.crypto.randomUUID();

const diagrammableIds = (document: ProjectDocument): ReadonlySet<string> =>
  new Set([
    ...document.uml.packages.map(({ id }) => id),
    ...document.uml.classes.map(({ id }) => id),
    ...document.uml.enumerations.map(({ id }) => id),
  ]);

const packageIds = (document: ProjectDocument): ReadonlySet<string> =>
  new Set(document.uml.packages.map(({ id }) => id));

const allElementIds = (document: ProjectDocument): ReadonlySet<string> => {
  const ids = new Set<string>([document.id]);
  for (const pkg of document.uml.packages) {
    ids.add(pkg.id);
  }
  for (const cls of document.uml.classes) {
    ids.add(cls.id);
    for (const attribute of cls.attributes) {
      ids.add(attribute.id);
    }
    for (const operation of cls.operations) {
      ids.add(operation.id);
      for (const parameter of operation.parameters) {
        ids.add(parameter.id);
      }
    }
  }
  for (const enumeration of document.uml.enumerations) {
    ids.add(enumeration.id);
    for (const literal of enumeration.literals) {
      ids.add(literal.id);
    }
  }
  for (const association of document.uml.associations) {
    ids.add(association.id);
    for (const end of association.ends) {
      ids.add(end.id);
    }
  }
  for (const generalization of document.uml.generalizations) {
    ids.add(generalization.id);
  }
  for (const node of document.layout.nodes) {
    ids.add(node.elementId);
  }
  return ids;
};

const toWorkspaceError = (domainError: UmlCommandError): WorkspaceError => {
  switch (domainError.kind) {
    case "unsupported-command":
      return { kind: "unsupported-command" };
    case "precondition-failed":
      return { kind: "precondition-failed", code: domainError.code };
    case "validation-failed":
      return { kind: "validation-failed", diagnostics: domainError.diagnostics };
  }
};

export const createWorkspaceController = ({
  adapter,
  idFactory = defaultIdFactory,
}: CreateWorkspaceControllerOptions): WorkspaceController => {
  let selectedElementId: string | null = null;
  let activePackageId: string | null = null;
  let dragPreview: DragPreview | null = null;
  let dragStartPosition: WorkspacePosition | null = null;
  let error: WorkspaceError | null = null;

  const reconcile = (): void => {
    const document = adapter.currentDocument;
    const nodes = diagrammableIds(document);
    const packages = packageIds(document);

    if (selectedElementId !== null && !nodes.has(selectedElementId)) {
      selectedElementId = null;
    }
    if (activePackageId !== null && !packages.has(activePackageId)) {
      activePackageId = null;
    }
  };

  const submitCommand = (command: UmlCommand): boolean => {
    const result = adapter.submit(command);
    if (result.kind === "accepted") {
      error = null;
      reconcile();
      return true;
    }

    error = toWorkspaceError(result.error);
    return false;
  };

  return {
    get state() {
      reconcile();
      return {
        currentDocument: adapter.currentDocument,
        selectedElementId,
        activePackageId,
        dragPreview,
        error,
        canUndo: adapter.canUndo,
        canRedo: adapter.canRedo,
      };
    },
    submit: submitCommand,
    select(elementId) {
      if (elementId === null) {
        selectedElementId = null;
        activePackageId = null;
        return;
      }

      const document = adapter.currentDocument;
      if (!diagrammableIds(document).has(elementId)) {
        return;
      }

      selectedElementId = elementId;
      activePackageId = packageIds(document).has(elementId) ? elementId : null;
    },
    undo() {
      const result = adapter.undo();
      if (result.kind === "restored") {
        dragPreview = null;
        dragStartPosition = null;
        error = null;
        reconcile();
      }
    },
    redo() {
      const result = adapter.redo();
      if (result.kind === "restored") {
        dragPreview = null;
        dragStartPosition = null;
        error = null;
        reconcile();
      }
    },
    createElementId() {
      const taken = allElementIds(adapter.currentDocument);
      let candidate = idFactory();
      let attempts = 0;
      while ((candidate.trim().length === 0 || taken.has(candidate)) && attempts < ID_ATTEMPT_LIMIT) {
        candidate = idFactory();
        attempts += 1;
      }
      return candidate;
    },
    dismissError() {
      error = null;
    },
    resolvePosition(elementId) {
      const document = adapter.currentDocument;
      if (!diagrammableIds(document).has(elementId)) {
        return null;
      }

      const confirmed = document.layout.nodes.find((node) => node.elementId === elementId);
      if (confirmed !== undefined) {
        return { x: confirmed.x, y: confirmed.y };
      }

      const index = [...diagrammableIds(document)].sort().indexOf(elementId);
      return {
        x: 80 + (index % 3) * 240,
        y: 80 + Math.floor(index / 3) * 180,
      };
    },
    beginDrag(elementId, position, relationAnchors) {
      if (dragPreview !== null) {
        return;
      }
      const document = adapter.currentDocument;
      if (!diagrammableIds(document).has(elementId)) {
        return;
      }
      dragPreview = { elementId, position, relationAnchors };
      dragStartPosition = position;
    },
    updateDrag(position) {
      if (dragPreview === null) {
        return;
      }
      dragPreview = { ...dragPreview, position };
    },
    cancelDrag() {
      dragPreview = null;
      dragStartPosition = null;
    },
    endDrag() {
      if (dragPreview === null || dragStartPosition === null) {
        return;
      }
      const { elementId, position } = dragPreview;
      const start = dragStartPosition;
      dragPreview = null;
      dragStartPosition = null;

      if (position.x === start.x && position.y === start.y) {
        return;
      }

      submitCommand({ kind: "MoveNode", elementId, x: position.x, y: position.y });
    },
  };
};

export const createWorkspaceSession = ({
  ownerId,
  idFactory = defaultIdFactory,
}: CreateWorkspaceSessionOptions): WorkspaceController => {
  const document = createProjectDocument({ name: INTERNAL_DOCUMENT_NAME, ownerId, idFactory });
  return createWorkspaceController({
    adapter: createUmlWorkspaceAdapter(new UmlCommandBus(document)),
    idFactory,
  });
};
