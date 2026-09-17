import type { ProjectDocument } from "../document/types.js";
import type {
  DiagramNodeLayout,
  UmlAssociation,
  UmlAttribute,
  UmlClass,
  UmlElementId,
  UmlEnumeration,
  UmlEnumerationLiteral,
  UmlGeneralization,
  UmlOperation,
  UmlPackage,
  UmlParameter,
} from "../model/types.js";
import type { GenerationProfile } from "../profile/types.js";
import type { ValidationDiagnostic } from "../validation/types.js";

export type UmlCommandKind =
  | "CreatePackage"
  | "RenamePackage"
  | "DeletePackage"
  | "CreateClass"
  | "RenameClass"
  | "DeleteClass"
  | "AddAttribute"
  | "UpdateAttribute"
  | "RemoveAttribute"
  | "AddOperation"
  | "UpdateOperation"
  | "RemoveOperation"
  | "AddParameter"
  | "UpdateParameter"
  | "RemoveParameter"
  | "CreateEnumeration"
  | "RenameEnumeration"
  | "DeleteEnumeration"
  | "AddEnumerationLiteral"
  | "RemoveEnumerationLiteral"
  | "CreateAssociation"
  | "UpdateAssociation"
  | "DeleteAssociation"
  | "CreateGeneralization"
  | "DeleteGeneralization"
  | "MoveNode"
  | "UpdateGenerationProfile";

export interface CreatePackageCommand {
  readonly kind: "CreatePackage";
  readonly parentPackageId: UmlElementId | null;
  readonly value: Readonly<Pick<UmlPackage, "id" | "name">>;
}

export interface RenamePackageCommand {
  readonly kind: "RenamePackage";
  readonly packageId: UmlElementId;
  readonly name: string;
}

export interface DeletePackageCommand {
  readonly kind: "DeletePackage";
  readonly packageId: UmlElementId;
}

export interface CreateClassCommand {
  readonly kind: "CreateClass";
  readonly packageId: UmlElementId;
  readonly value: Readonly<Pick<UmlClass, "id" | "name">>;
}

export interface RenameClassCommand {
  readonly kind: "RenameClass";
  readonly classId: UmlElementId;
  readonly name: string;
}

export interface DeleteClassCommand {
  readonly kind: "DeleteClass";
  readonly classId: UmlElementId;
}

export interface AddAttributeCommand {
  readonly kind: "AddAttribute";
  readonly classId: UmlElementId;
  readonly value: Readonly<Omit<UmlAttribute, "kind">>;
}

export interface UpdateAttributeCommand {
  readonly kind: "UpdateAttribute";
  readonly classId: UmlElementId;
  readonly attributeId: UmlElementId;
  readonly name: string;
  readonly visibility: UmlAttribute["visibility"];
  readonly type: UmlAttribute["type"];
  readonly multiplicity: UmlAttribute["multiplicity"];
}

export interface RemoveAttributeCommand {
  readonly kind: "RemoveAttribute";
  readonly classId: UmlElementId;
  readonly attributeId: UmlElementId;
}

export interface AddOperationCommand {
  readonly kind: "AddOperation";
  readonly classId: UmlElementId;
  readonly value: Readonly<Omit<UmlOperation, "kind" | "parameters">> & {
    readonly parameters: readonly Readonly<Omit<UmlParameter, "kind">>[];
  };
}

export interface UpdateOperationCommand {
  readonly kind: "UpdateOperation";
  readonly classId: UmlElementId;
  readonly operationId: UmlElementId;
  readonly name: string;
  readonly visibility: UmlOperation["visibility"];
  readonly parameters: UmlOperation["parameters"];
  readonly returnType?: UmlOperation["returnType"];
}

export interface RemoveOperationCommand {
  readonly kind: "RemoveOperation";
  readonly classId: UmlElementId;
  readonly operationId: UmlElementId;
}

export interface AddParameterCommand {
  readonly kind: "AddParameter";
  readonly classId: UmlElementId;
  readonly operationId: UmlElementId;
  readonly value: Readonly<Omit<UmlParameter, "kind">>;
}

export interface UpdateParameterCommand {
  readonly kind: "UpdateParameter";
  readonly classId: UmlElementId;
  readonly operationId: UmlElementId;
  readonly parameterId: UmlElementId;
  readonly name: string;
  readonly type: UmlParameter["type"];
  readonly multiplicity: UmlParameter["multiplicity"];
}

export interface RemoveParameterCommand {
  readonly kind: "RemoveParameter";
  readonly classId: UmlElementId;
  readonly operationId: UmlElementId;
  readonly parameterId: UmlElementId;
}

export interface CreateEnumerationCommand {
  readonly kind: "CreateEnumeration";
  readonly packageId: UmlElementId;
  readonly value: Readonly<Pick<UmlEnumeration, "id" | "name">>;
}

export interface RenameEnumerationCommand {
  readonly kind: "RenameEnumeration";
  readonly enumerationId: UmlElementId;
  readonly name: string;
}

export interface DeleteEnumerationCommand {
  readonly kind: "DeleteEnumeration";
  readonly enumerationId: UmlElementId;
}

export interface AddEnumerationLiteralCommand {
  readonly kind: "AddEnumerationLiteral";
  readonly enumerationId: UmlElementId;
  readonly value: Readonly<Omit<UmlEnumerationLiteral, "kind">>;
}

export interface RemoveEnumerationLiteralCommand {
  readonly kind: "RemoveEnumerationLiteral";
  readonly enumerationId: UmlElementId;
  readonly literalId: UmlElementId;
}

export interface CreateAssociationCommand {
  readonly kind: "CreateAssociation";
  readonly value: Readonly<Omit<UmlAssociation, "kind" | "ends">> & {
    readonly ends: readonly [
      Readonly<Omit<UmlAssociation["ends"][0], "kind">>,
      Readonly<Omit<UmlAssociation["ends"][1], "kind">>,
    ];
  };
}

export interface UpdateAssociationCommand {
  readonly kind: "UpdateAssociation";
  readonly associationId: UmlElementId;
  readonly name?: UmlAssociation["name"];
  readonly ends: UmlAssociation["ends"];
}

export interface DeleteAssociationCommand {
  readonly kind: "DeleteAssociation";
  readonly associationId: UmlElementId;
}

export interface CreateGeneralizationCommand {
  readonly kind: "CreateGeneralization";
  readonly value: Readonly<Omit<UmlGeneralization, "kind">>;
}

export interface DeleteGeneralizationCommand {
  readonly kind: "DeleteGeneralization";
  readonly generalizationId: UmlElementId;
}

export interface MoveNodeCommand {
  readonly kind: "MoveNode";
  readonly elementId: UmlElementId;
  readonly x: DiagramNodeLayout["x"];
  readonly y: DiagramNodeLayout["y"];
}

export interface UpdateGenerationProfileCommand {
  readonly kind: "UpdateGenerationProfile";
  readonly classes: GenerationProfile["classes"];
  readonly attributes: GenerationProfile["attributes"];
  readonly defaultSort: GenerationProfile["defaultSort"];
}

export type UmlCommand =
  | CreatePackageCommand
  | RenamePackageCommand
  | DeletePackageCommand
  | CreateClassCommand
  | RenameClassCommand
  | DeleteClassCommand
  | AddAttributeCommand
  | UpdateAttributeCommand
  | RemoveAttributeCommand
  | AddOperationCommand
  | UpdateOperationCommand
  | RemoveOperationCommand
  | AddParameterCommand
  | UpdateParameterCommand
  | RemoveParameterCommand
  | CreateEnumerationCommand
  | RenameEnumerationCommand
  | DeleteEnumerationCommand
  | AddEnumerationLiteralCommand
  | RemoveEnumerationLiteralCommand
  | CreateAssociationCommand
  | UpdateAssociationCommand
  | DeleteAssociationCommand
  | CreateGeneralizationCommand
  | DeleteGeneralizationCommand
  | MoveNodeCommand
  | UpdateGenerationProfileCommand;

export type UmlCommandPreconditionCode =
  | "TARGET_NOT_FOUND"
  | "PARENT_NOT_FOUND"
  | "PARENT_MISMATCH"
  | "DUPLICATE_ID"
  | "DUPLICATE_NAME"
  | "DEPENDENCIES_EXIST"
  | "INCOMPATIBLE_REFERENCE";

export interface UnsupportedUmlCommandError {
  readonly kind: "unsupported-command";
}

export interface UmlCommandPreconditionError {
  readonly kind: "precondition-failed";
  readonly code: UmlCommandPreconditionCode;
}

export interface UmlCommandValidationError {
  readonly kind: "validation-failed";
  readonly diagnostics: readonly ValidationDiagnostic[];
}

export type UmlCommandError =
  | UnsupportedUmlCommandError
  | UmlCommandPreconditionError
  | UmlCommandValidationError;

export interface AcceptedUmlCommandResult {
  readonly kind: "accepted";
  readonly document: ProjectDocument;
}

export interface RejectedUmlCommandResult {
  readonly kind: "rejected";
  readonly error: UmlCommandError;
}

export type UmlCommandResult =
  | AcceptedUmlCommandResult
  | RejectedUmlCommandResult;

export type UmlHistoryResult =
  | {
      readonly kind: "restored";
      readonly operation: "undo" | "redo";
      readonly document: ProjectDocument;
    }
  | {
      readonly kind: "unavailable";
      readonly operation: "undo" | "redo";
    };
