import {
  emptyCanonicalUmlModel,
  emptyDiagramLayout,
} from "../model/types.js";
import { emptyGenerationProfile } from "../profile/types.js";
import {
  CURRENT_PROJECT_DOCUMENT_SCHEMA_VERSION,
  type Clock,
  type IdFactory,
  type ProjectDocument,
} from "./types.js";

export interface CreateProjectDocumentInput {
  name: string;
  ownerId: string;
  idFactory?: IdFactory;
  clock?: Clock;
}

const defaultIdFactory: IdFactory = () => globalThis.crypto.randomUUID();
const defaultClock: Clock = () => new Date();

export const createProjectDocument = ({
  name,
  ownerId,
  idFactory = defaultIdFactory,
  clock = defaultClock,
}: CreateProjectDocumentInput): ProjectDocument => {
  const normalizedName = name.trim();
  const normalizedOwnerId = ownerId.trim();

  if (normalizedName.length === 0) {
    throw new Error("Project document name is required.");
  }
  if (normalizedOwnerId.length === 0) {
    throw new Error("Project document ownerId is required.");
  }

  const timestamp = clock().toISOString();

  return {
    schemaVersion: CURRENT_PROJECT_DOCUMENT_SCHEMA_VERSION,
    id: idFactory(),
    name: normalizedName,
    ownerId: normalizedOwnerId,
    revision: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    uml: emptyCanonicalUmlModel(),
    layout: emptyDiagramLayout(),
    generationProfile: emptyGenerationProfile(),
  };
};
