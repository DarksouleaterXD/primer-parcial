import { Injectable } from "@nestjs/common";
import type {
  CreateProjectRequest,
  DeleteProjectRequest,
  ProjectList,
  ProjectSnapshot,
  RenameProjectRequest,
  SaveProjectDocumentRequest,
} from "@primer-parcial/contracts";
import {
  createProjectDocument,
  parseProjectDocument,
  validateProjectDocument,
  type ProjectDocument,
} from "@primer-parcial/uml-domain";

import { AuthDataSource } from "../database/auth-data-source.js";
import {
  projectDocumentInvalid,
  projectNotFound,
  projectRevisionConflict,
  projectStorageUnavailable,
} from "./project-errors.js";
import {
  UmlProjectRepository,
  type ProjectMutationResult,
} from "./uml-project.repository.js";

@Injectable()
export class UmlProjectService {
  constructor(private readonly dataSource: AuthDataSource) {}

  async create(ownerId: string, request: CreateProjectRequest): Promise<ProjectSnapshot> {
    const document = createProjectDocument({ name: request.name, ownerId });
    assertSaveValid(document);
    const stored = await this.withRepository((repository) => repository.insert(ownerId, document));
    return snapshot(stored);
  }

  async list(ownerId: string): Promise<ProjectList> {
    const projects = await this.withRepository((repository) => repository.listOwned(ownerId));
    return { projects: [...projects] };
  }

  async get(ownerId: string, projectId: string): Promise<ProjectSnapshot> {
    const document = await this.withRepository((repository) =>
      repository.findOwnedById(ownerId, projectId),
    );
    if (document === null) {
      throw projectNotFound();
    }
    return snapshot(document);
  }

  async rename(
    ownerId: string,
    projectId: string,
    request: RenameProjectRequest,
  ): Promise<ProjectSnapshot> {
    const result = await this.withRepository((repository) =>
      repository.renameOwned(
        ownerId,
        projectId,
        request.expectedRevision,
        request.name,
        new Date().toISOString(),
      ),
    );
    return mutationSnapshot(result);
  }

  async save(
    ownerId: string,
    projectId: string,
    request: SaveProjectDocumentRequest,
  ): Promise<ProjectSnapshot> {
    const document = parseSubmittedDocument(request.document);
    assertSaveValid(document);

    const result = await this.withRepository((repository) =>
      repository.replaceOwnedDocument(
        ownerId,
        projectId,
        request.expectedRevision,
        document,
        new Date().toISOString(),
      ),
    );
    return mutationSnapshot(result);
  }

  async delete(
    ownerId: string,
    projectId: string,
    request: DeleteProjectRequest,
  ): Promise<void> {
    const result = await this.withRepository((repository) =>
      repository.deleteOwned(ownerId, projectId, request.expectedRevision),
    );

    if (result.kind === "deleted") {
      return;
    }
    if (result.kind === "not-found") {
      throw projectNotFound();
    }
    throw projectRevisionConflict();
  }

  private async withRepository<Value>(
    action: (repository: UmlProjectRepository) => Promise<Value>,
  ): Promise<Value> {
    try {
      const repository = new UmlProjectRepository(await this.dataSource.get());
      return await action(repository);
    } catch {
      throw projectStorageUnavailable();
    }
  }
}

function parseSubmittedDocument(value: unknown): ProjectDocument {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      throw new Error("Project document is not JSON serializable.");
    }
    return parseProjectDocument(serialized);
  } catch {
    throw projectDocumentInvalid();
  }
}

function assertSaveValid(document: ProjectDocument): void {
  if (validateProjectDocument(document, "save").blocked) {
    throw projectDocumentInvalid();
  }
}

function mutationSnapshot(result: ProjectMutationResult): ProjectSnapshot {
  if (result.kind === "updated") {
    return snapshot(result.document);
  }
  if (result.kind === "not-found") {
    throw projectNotFound();
  }
  if (result.kind === "conflict") {
    throw projectRevisionConflict();
  }
  throw projectDocumentInvalid();
}

function snapshot(document: ProjectDocument): ProjectSnapshot {
  return {
    id: document.id,
    name: document.name,
    revision: document.revision,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    document,
  };
}
