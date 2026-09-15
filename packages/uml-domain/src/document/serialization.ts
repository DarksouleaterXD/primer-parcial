import {
  CURRENT_PROJECT_DOCUMENT_SCHEMA_VERSION,
  type ProjectDocument,
} from "./types.js";
import { collectProjectDocumentStructureIssues } from "./runtime-schema.js";
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

  if (
    isRecord(parsed) &&
    parsed.schemaVersion !== CURRENT_PROJECT_DOCUMENT_SCHEMA_VERSION
  ) {
    throw new ProjectDocumentParseError(
      "DOCUMENT_VERSION_UNSUPPORTED",
      `Unsupported project document schema version '${String(parsed.schemaVersion)}'.`,
    );
  }

  const structuralIssues = collectProjectDocumentStructureIssues(parsed);
  if (structuralIssues.length > 0) {
    const issue = structuralIssues[0]!;
    throw new ProjectDocumentParseError(
      "DOCUMENT_STRUCTURE_INVALID",
      `Project document structure is invalid at '${issue.path}': ${issue.message}`,
    );
  }

  const document = parsed as ProjectDocument;
  const diagnostics = collectValidationDiagnostics(document);
  const blockingDiagnostic = diagnostics.find(
    (item) => item.severity === "error",
  );

  if (blockingDiagnostic !== undefined) {
    throw new ProjectDocumentParseError(
      "DOCUMENT_STRUCTURE_INVALID",
      `Project document is invalid at '${blockingDiagnostic.path}' (${blockingDiagnostic.code}): ${blockingDiagnostic.message}`,
    );
  }

  return document;
};
