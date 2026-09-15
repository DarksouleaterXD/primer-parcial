import type {
  CanonicalUmlModel,
  DiagramLayout,
  UmlElementId,
} from "../model/types.js";
import type { GenerationProfile } from "../profile/types.js";

export const CURRENT_PROJECT_DOCUMENT_SCHEMA_VERSION = 1 as const;

export type ProjectDocumentSchemaVersion =
  typeof CURRENT_PROJECT_DOCUMENT_SCHEMA_VERSION;

export interface ProjectDocument {
  schemaVersion: ProjectDocumentSchemaVersion;
  id: UmlElementId;
  name: string;
  ownerId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  uml: CanonicalUmlModel;
  layout: DiagramLayout;
  generationProfile: GenerationProfile;
}

export type IdFactory = () => string;
export type Clock = () => Date;
