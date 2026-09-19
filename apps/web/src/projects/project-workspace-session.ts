import type { ProjectSnapshot } from "@primer-parcial/contracts";
import {
  parseProjectDocument,
  serializeProjectDocument,
  UmlCommandBus,
  type ProjectDocument,
} from "@primer-parcial/uml-domain";

import {
  type ProjectRepository,
  type ProjectRepositoryError,
} from "./project-repository";
import { createUmlWorkspaceAdapter } from "../uml-workspace/uml-workspace-adapter";
import {
  createWorkspaceController,
  type WorkspaceController,
  type WorkspaceIdFactory,
} from "../uml-workspace/workspace-controller";

export interface ProjectWorkspaceSession {
  readonly controller: WorkspaceController;
  readonly projectId: string;
  readonly durableRevision: number;
  readonly durableSnapshot: ProjectSnapshot;
  save(): Promise<ProjectWorkspaceSaveOutcome>;
}

export type ProjectWorkspaceLoadOutcome =
  | { readonly kind: "ready"; readonly session: ProjectWorkspaceSession }
  | { readonly kind: "error"; readonly error: ProjectRepositoryError };

export type ProjectWorkspaceSaveOutcome =
  | { readonly kind: "saved"; readonly snapshot: ProjectSnapshot }
  | { readonly kind: "unauthenticated"; readonly message: string }
  | { readonly kind: "invalid"; readonly message: string }
  | { readonly kind: "not-found"; readonly message: string }
  | { readonly kind: "conflict"; readonly message: string }
  | { readonly kind: "unavailable"; readonly message: string };

export async function createDurableWorkspaceSession(
  repository: ProjectRepository,
  name: string,
  idFactory?: WorkspaceIdFactory,
): Promise<ProjectWorkspaceLoadOutcome> {
  const result = await repository.create({ name });
  return result.kind === "error"
    ? result
    : { kind: "ready", session: sessionFromSnapshot(repository, result.data, idFactory) };
}

export async function reopenDurableWorkspaceSession(
  repository: ProjectRepository,
  projectId: string,
  idFactory?: WorkspaceIdFactory,
): Promise<ProjectWorkspaceLoadOutcome> {
  const result = await repository.reopenProject(projectId);
  return result.kind === "error"
    ? result
    : { kind: "ready", session: sessionFromSnapshot(repository, result.data, idFactory) };
}

function sessionFromSnapshot(
  repository: ProjectRepository,
  snapshot: ProjectSnapshot,
  idFactory?: WorkspaceIdFactory,
): ProjectWorkspaceSession {
  let durableSnapshot = canonicalSnapshot(snapshot);
  const controller = createWorkspaceController({
    adapter: createUmlWorkspaceAdapter(new UmlCommandBus(durableSnapshot.document)),
    idFactory,
  });

  return {
    controller,
    get projectId() {
      return durableSnapshot.id;
    },
    get durableRevision() {
      return durableSnapshot.revision;
    },
    get durableSnapshot() {
      return durableSnapshot;
    },
    async save() {
      const document = documentForSave(controller.state.currentDocument, durableSnapshot);
      const result = await repository.save(durableSnapshot.id, {
        document,
        expectedRevision: durableSnapshot.revision,
      });

      if (result.kind === "error") {
        return toSaveFailure(result.error);
      }
      if (result.data.id !== durableSnapshot.id) {
        return {
          kind: "unavailable",
          message: "La respuesta de guardado no corresponde al proyecto abierto.",
        };
      }

      durableSnapshot = canonicalSnapshot(result.data);
      return { kind: "saved", snapshot: durableSnapshot };
    },
  };
}

function canonicalSnapshot(snapshot: ProjectSnapshot): ProjectSnapshot {
  const document = parseProjectDocument(serializeProjectDocument(snapshot.document));
  if (
    document.id !== snapshot.id ||
    document.name !== snapshot.name ||
    document.revision !== snapshot.revision ||
    document.createdAt !== snapshot.createdAt ||
    document.updatedAt !== snapshot.updatedAt
  ) {
    throw new Error("Project snapshot metadata does not match its canonical document.");
  }
  return { ...snapshot, document };
}

function documentForSave(
  localDocument: ProjectDocument,
  durableSnapshot: ProjectSnapshot,
): ProjectDocument {
  const durable = durableSnapshot.document;
  return parseProjectDocument(
    serializeProjectDocument({
      ...localDocument,
      id: durable.id,
      ownerId: durable.ownerId,
      name: durable.name,
      revision: durableSnapshot.revision,
      createdAt: durableSnapshot.createdAt,
      updatedAt: durableSnapshot.updatedAt,
    }),
  );
}

function toSaveFailure(error: ProjectRepositoryError): ProjectWorkspaceSaveOutcome {
  switch (error.kind) {
    case "unauthenticated":
      return { kind: "unauthenticated", message: "Tu sesión ya no está disponible." };
    case "invalid-request":
      return { kind: "invalid", message: "El proyecto no pudo guardarse porque el documento no es válido." };
    case "not-found":
      return { kind: "not-found", message: "El proyecto ya no está disponible." };
    case "conflict":
      return {
        kind: "conflict",
        message: "El proyecto cambió en el servidor. Volvé a abrirlo antes de guardar.",
      };
    case "unavailable":
      return { kind: "unavailable", message: "No fue posible guardar el proyecto." };
  }
}
