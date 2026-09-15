import {
  CURRENT_PROJECT_DOCUMENT_SCHEMA_VERSION,
  type ProjectDocument,
} from "./types.js";
import { collectValidationDiagnostics } from "../validation/validator.js";

export type ProjectDocumentParseErrorCode =
  | "DOCUMENT_VERSION_UNSUPPORTED"
  | "DOCUMENT_STRUCTURE_INVALID";

export class ProjectDocumentParseError extends Error {
  readonly code: ProjectDocumentParseErrorCode;

  constructor(code: ProjectDocumentParseErrorCode, message: string) {
    super(message);
    this.name = "ProjectDocumentParseError";
    this.code = code;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function assertMinimumShape(value: unknown): asserts value is ProjectDocument {
  if (!isRecord(value)) {
    throw new ProjectDocumentParseError(
      "DOCUMENT_STRUCTURE_INVALID",
      "Project document must be a JSON object.",
    );
  }

  if (value.schemaVersion !== CURRENT_PROJECT_DOCUMENT_SCHEMA_VERSION) {
    throw new ProjectDocumentParseError(
      "DOCUMENT_VERSION_UNSUPPORTED",
      `Unsupported project document schema version '${String(value.schemaVersion)}'.`,
    );
  }

  const requiredStrings = ["id", "name", "ownerId", "createdAt", "updatedAt"];
  for (const key of requiredStrings) {
    if (typeof value[key] !== "string") {
      throw new ProjectDocumentParseError(
        "DOCUMENT_STRUCTURE_INVALID",
        `Project document '${key}' must be a string.`,
      );
    }
  }

  if (!Number.isInteger(value.revision) || (value.revision as number) < 0) {
    throw new ProjectDocumentParseError(
      "DOCUMENT_STRUCTURE_INVALID",
      "Project document revision must be a non-negative integer.",
    );
  }

  if (!isRecord(value.uml) || !isRecord(value.layout) || !isRecord(value.generationProfile)) {
    throw new ProjectDocumentParseError(
      "DOCUMENT_STRUCTURE_INVALID",
      "Project document UML, layout and generationProfile must be objects.",
    );
  }

  const umlCollections = [
    "packages",
    "classes",
    "enumerations",
    "associations",
    "generalizations",
  ];
  for (const key of umlCollections) {
    if (!Array.isArray(value.uml[key])) {
      throw new ProjectDocumentParseError(
        "DOCUMENT_STRUCTURE_INVALID",
        `Project document uml.${key} must be an array.`,
      );
    }
  }

  if (!Array.isArray(value.layout.nodes)) {
    throw new ProjectDocumentParseError(
      "DOCUMENT_STRUCTURE_INVALID",
      "Project document layout.nodes must be an array.",
    );
  }

  for (const key of ["classes", "attributes", "defaultSort"]) {
    if (!Array.isArray(value.generationProfile[key])) {
      throw new ProjectDocumentParseError(
        "DOCUMENT_STRUCTURE_INVALID",
        `Project document generationProfile.${key} must be an array.`,
      );
    }
  }
}

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => [key, stableValue(value[key])]),
  );
};

export const serializeProjectDocument = (document: ProjectDocument): string =>
  JSON.stringify(stableValue(document));

export const parseProjectDocument = (serialized: string): ProjectDocument => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    throw new ProjectDocumentParseError(
      "DOCUMENT_STRUCTURE_INVALID",
      "Project document is not valid JSON.",
    );
  }

  assertMinimumShape(parsed);
  const diagnostics = collectValidationDiagnostics(parsed);
  if (diagnostics.some((item) => item.code === "VALIDATION_INTERNAL_ERROR")) {
    throw new ProjectDocumentParseError(
      "DOCUMENT_STRUCTURE_INVALID",
      "Project document contains an unsupported structural shape.",
    );
  }

  return parsed;
};
