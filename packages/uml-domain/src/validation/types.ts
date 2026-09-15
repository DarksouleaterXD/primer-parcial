export type ValidationSeverity = "error" | "warning";

export type ValidationDiagnosticCode =
  | "DOCUMENT_VERSION_UNSUPPORTED"
  | "DOCUMENT_STRUCTURE_INVALID"
  | "UML_ID_DUPLICATE"
  | "UML_NAME_REQUIRED"
  | "UML_NAME_DUPLICATE"
  | "UML_REFERENCE_MISSING"
  | "UML_MULTIPLICITY_INVALID"
  | "UML_PACKAGE_CYCLE"
  | "UML_GENERALIZATION_CYCLE"
  | "UML_ASSOCIATION_INVALID"
  | "LAYOUT_REFERENCE_MISSING"
  | "PROFILE_REFERENCE_MISSING"
  | "PROFILE_REFERENCE_INCOMPATIBLE"
  | "VALIDATION_INTERNAL_ERROR";

export interface ValidationDiagnostic {
  severity: ValidationSeverity;
  code: ValidationDiagnosticCode;
  message: string;
  path: string;
  elementId?: string;
}

export type ValidationPolicy = "edit" | "save" | "import" | "generate";

export interface ValidationResult {
  policy: ValidationPolicy;
  diagnostics: ValidationDiagnostic[];
  hasErrors: boolean;
  blocked: boolean;
}
