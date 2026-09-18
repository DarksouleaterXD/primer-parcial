import {
  parseProjectDocument,
  serializeProjectDocument,
  type ProjectDocument,
} from "@primer-parcial/uml-domain";
import type { DataSource, EntityManager, Repository } from "typeorm";

import { UmlProjectEntity } from "./uml-project.entity.js";

export type ProjectStorageErrorCode =
  | "PROJECT_STORAGE_DOCUMENT_INVALID"
  | "PROJECT_STORAGE_CORRUPT"
  | "PROJECT_STORAGE_FAILURE";

const STORAGE_ERROR_MESSAGES: Record<ProjectStorageErrorCode, string> = {
  PROJECT_STORAGE_DOCUMENT_INVALID: "Project document is invalid for storage.",
  PROJECT_STORAGE_CORRUPT: "Stored project data is invalid.",
  PROJECT_STORAGE_FAILURE: "Project storage operation failed.",
};

export class ProjectStorageError extends Error {
  readonly code: ProjectStorageErrorCode;

  constructor(code: ProjectStorageErrorCode) {
    super(STORAGE_ERROR_MESSAGES[code]);
    this.name = "ProjectStorageError";
    this.code = code;
  }
}

export interface ProjectStorageSummary {
  readonly id: string;
  readonly name: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ProjectMutationResult =
  | { readonly kind: "updated"; readonly document: ProjectDocument }
  | { readonly kind: "not-found" }
  | { readonly kind: "conflict" }
  | { readonly kind: "invalid-document-metadata" };

export type ProjectDeleteResult =
  | { readonly kind: "deleted" }
  | { readonly kind: "not-found" }
  | { readonly kind: "conflict" };

export class UmlProjectRepository {
  constructor(private readonly dataSource: DataSource) {}

  async insert(ownerId: string, document: ProjectDocument): Promise<ProjectDocument> {
    const canonical = canonicalDocumentForWrite(ownerId, document);
    const repository = this.repository();

    try {
      await repository.insert({
        id: canonical.id,
        ownerId,
        name: canonical.name,
        revision: canonical.revision,
        document: JSON.parse(serializeProjectDocument(canonical)) as object,
        createdAt: new Date(canonical.createdAt),
        updatedAt: new Date(canonical.updatedAt),
      });
    } catch {
      throw new ProjectStorageError("PROJECT_STORAGE_FAILURE");
    }

    const stored = await this.findOwnedById(ownerId, canonical.id);
    if (stored === null) {
      throw new ProjectStorageError("PROJECT_STORAGE_FAILURE");
    }
    return stored;
  }

  async findOwnedById(ownerId: string, projectId: string): Promise<ProjectDocument | null> {
    let entity: UmlProjectEntity | null;
    try {
      entity = await this.repository().findOneBy({ id: projectId, ownerId });
    } catch {
      throw new ProjectStorageError("PROJECT_STORAGE_FAILURE");
    }

    return entity === null ? null : canonicalDocumentFromRow(entity);
  }

  async listOwned(ownerId: string): Promise<readonly ProjectStorageSummary[]> {
    let entities: UmlProjectEntity[];
    try {
      entities = await this.repository().find({
        where: { ownerId },
        select: {
          id: true,
          name: true,
          revision: true,
          createdAt: true,
          updatedAt: true,
        },
        order: { updatedAt: "DESC", id: "ASC" },
      });
    } catch {
      throw new ProjectStorageError("PROJECT_STORAGE_FAILURE");
    }

    return entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      revision: entity.revision,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }));
  }

  async renameOwned(
    ownerId: string,
    projectId: string,
    expectedRevision: number,
    name: string,
    updatedAt: string,
  ): Promise<ProjectMutationResult> {
    const documentPatch = JSON.stringify({
      name,
      revision: expectedRevision + 1,
      updatedAt,
    });

    try {
      return await this.dataSource.transaction(async (manager) => {
        const result = await manager
          .createQueryBuilder()
          .update(UmlProjectEntity)
          .set({
            name,
            revision: () => '"revision" + 1',
            updatedAt: new Date(updatedAt),
            document: () => '"document" || CAST(:documentPatch AS jsonb)',
          })
          .where('"id" = :projectId AND "owner_id" = :ownerId AND "revision" = :expectedRevision', {
            projectId,
            ownerId,
            expectedRevision,
          })
          .setParameter("documentPatch", documentPatch)
          .execute();

        if (result.affected === 1) {
          const updated = await findOwnedEntity(manager, ownerId, projectId);
          if (updated === null) {
            throw new ProjectStorageError("PROJECT_STORAGE_FAILURE");
          }
          return { kind: "updated", document: canonicalDocumentFromRow(updated) };
        }

        return classifyConditionalMiss(manager, ownerId, projectId, expectedRevision);
      });
    } catch (error) {
      throw normalizeStorageFailure(error);
    }
  }

  async replaceOwnedDocument(
    ownerId: string,
    projectId: string,
    expectedRevision: number,
    document: ProjectDocument,
    updatedAt: string,
  ): Promise<ProjectMutationResult> {
    const canonical = canonicalDocument(document);
    const requestMetadataMatchesTarget =
      canonical.id === projectId &&
      canonical.ownerId === ownerId &&
      canonical.revision === expectedRevision;

    const nextDocument = canonicalDocument({
      ...canonical,
      revision: expectedRevision + 1,
      updatedAt,
    });
    const serialized = serializeProjectDocument(nextDocument);

    try {
      return await this.dataSource.transaction(async (manager) => {
        let affected = 0;

        if (requestMetadataMatchesTarget) {
          const result = await manager
            .createQueryBuilder()
            .update(UmlProjectEntity)
            .set({
              revision: () => '"revision" + 1',
              updatedAt: new Date(updatedAt),
              document: () => "CAST(:serializedDocument AS jsonb)",
            })
            .where('"id" = :projectId AND "owner_id" = :ownerId AND "revision" = :expectedRevision', {
              projectId,
              ownerId,
              expectedRevision,
            })
            .andWhere('"name" = :name', { name: canonical.name })
            .andWhere('"created_at" = :createdAt', { createdAt: new Date(canonical.createdAt) })
            .andWhere('"updated_at" = :currentUpdatedAt', {
              currentUpdatedAt: new Date(canonical.updatedAt),
            })
            .setParameter("serializedDocument", serialized)
            .execute();
          affected = result.affected ?? 0;
        }

        if (affected === 1) {
          const updated = await findOwnedEntity(manager, ownerId, projectId);
          if (updated === null) {
            throw new ProjectStorageError("PROJECT_STORAGE_FAILURE");
          }
          return { kind: "updated", document: canonicalDocumentFromRow(updated) };
        }

        const existing = await findOwnedEntity(manager, ownerId, projectId);
        if (existing === null) {
          return { kind: "not-found" };
        }
        if (existing.revision !== expectedRevision) {
          return { kind: "conflict" };
        }
        return { kind: "invalid-document-metadata" };
      });
    } catch (error) {
      throw normalizeStorageFailure(error);
    }
  }

  async deleteOwned(
    ownerId: string,
    projectId: string,
    expectedRevision: number,
  ): Promise<ProjectDeleteResult> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const result = await manager
          .createQueryBuilder()
          .delete()
          .from(UmlProjectEntity)
          .where('"id" = :projectId AND "owner_id" = :ownerId AND "revision" = :expectedRevision', {
            projectId,
            ownerId,
            expectedRevision,
          })
          .execute();

        if (result.affected === 1) {
          return { kind: "deleted" };
        }
        return classifyConditionalMiss(manager, ownerId, projectId, expectedRevision);
      });
    } catch (error) {
      throw normalizeStorageFailure(error);
    }
  }

  private repository(): Repository<UmlProjectEntity> {
    return this.dataSource.getRepository(UmlProjectEntity);
  }
}

async function classifyConditionalMiss(
  manager: EntityManager,
  ownerId: string,
  projectId: string,
  expectedRevision: number,
): Promise<{ readonly kind: "not-found" } | { readonly kind: "conflict" }> {
  const existing = await findOwnedEntity(manager, ownerId, projectId);
  if (existing === null) {
    return { kind: "not-found" };
  }
  if (existing.revision !== expectedRevision) {
    return { kind: "conflict" };
  }
  throw new ProjectStorageError("PROJECT_STORAGE_FAILURE");
}

async function findOwnedEntity(
  manager: EntityManager,
  ownerId: string,
  projectId: string,
): Promise<UmlProjectEntity | null> {
  return manager.getRepository(UmlProjectEntity).findOneBy({ id: projectId, ownerId });
}

function canonicalDocumentForWrite(ownerId: string, document: ProjectDocument): ProjectDocument {
  const canonical = canonicalDocument(document);
  if (canonical.ownerId !== ownerId) {
    throw new ProjectStorageError("PROJECT_STORAGE_DOCUMENT_INVALID");
  }
  return canonical;
}

function canonicalDocument(document: ProjectDocument): ProjectDocument {
  try {
    return parseProjectDocument(serializeProjectDocument(document));
  } catch {
    throw new ProjectStorageError("PROJECT_STORAGE_DOCUMENT_INVALID");
  }
}

function canonicalDocumentFromRow(entity: UmlProjectEntity): ProjectDocument {
  let document: ProjectDocument;
  try {
    document = parseProjectDocument(JSON.stringify(entity.document));
  } catch {
    throw new ProjectStorageError("PROJECT_STORAGE_CORRUPT");
  }

  const metadataMatches =
    document.id === entity.id &&
    document.ownerId === entity.ownerId &&
    document.name === entity.name &&
    document.revision === entity.revision &&
    new Date(document.createdAt).getTime() === entity.createdAt.getTime() &&
    new Date(document.updatedAt).getTime() === entity.updatedAt.getTime();

  if (!metadataMatches) {
    throw new ProjectStorageError("PROJECT_STORAGE_CORRUPT");
  }
  return document;
}

function normalizeStorageFailure(error: unknown): ProjectStorageError {
  return error instanceof ProjectStorageError
    ? error
    : new ProjectStorageError("PROJECT_STORAGE_FAILURE");
}
