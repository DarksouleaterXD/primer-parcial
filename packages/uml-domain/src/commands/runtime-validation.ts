import type { UmlCommand } from "./types.js";

type UnknownRecord = Record<string, unknown>;

const hasOwn = (value: UnknownRecord, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: UnknownRecord,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean => {
  const allowed = new Set([...required, ...optional]);
  return (
    required.every((key) => hasOwn(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key))
  );
};

const isString = (value: unknown): value is string => typeof value === "string";
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const isMultiplicity = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ["lower", "upper"]) &&
  isNonNegativeInteger(value.lower) &&
  (value.upper === "*" || isNonNegativeInteger(value.upper));

const isTypeReference = (value: unknown): boolean => {
  if (!isRecord(value) || !isString(value.kind)) {
    return false;
  }
  if (value.kind === "primitive") {
    return (
      hasExactKeys(value, ["kind", "name"]) &&
      ["string", "integer", "decimal", "boolean", "date", "datetime", "uuid"].includes(
        value.name as string,
      )
    );
  }
  return (
    value.kind === "classifier" &&
    hasExactKeys(value, ["kind", "classifierId"]) &&
    isString(value.classifierId)
  );
};

const isAttribute = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ["kind", "id", "name", "visibility", "type", "multiplicity"]) &&
  value.kind === "attribute" &&
  isString(value.id) &&
  isString(value.name) &&
  ["public", "protected", "private", "package"].includes(value.visibility as string) &&
  isTypeReference(value.type) &&
  isMultiplicity(value.multiplicity);

const isParameter = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ["kind", "id", "name", "type", "multiplicity"]) &&
  value.kind === "parameter" &&
  isString(value.id) &&
  isString(value.name) &&
  isTypeReference(value.type) &&
  isMultiplicity(value.multiplicity);

const isOperation = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ["kind", "id", "name", "visibility", "parameters"], ["returnType"]) &&
  value.kind === "operation" &&
  isString(value.id) &&
  isString(value.name) &&
  ["public", "protected", "private", "package"].includes(value.visibility as string) &&
  Array.isArray(value.parameters) &&
  value.parameters.every(isParameter) &&
  (!hasOwn(value, "returnType") || isTypeReference(value.returnType));

const isPackage = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ["kind", "id", "name"], ["parentPackageId"]) &&
  value.kind === "package" &&
  isString(value.id) &&
  isString(value.name) &&
  (!hasOwn(value, "parentPackageId") || isString(value.parentPackageId));

const isClass = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ["kind", "id", "name", "attributes", "operations"], ["packageId"]) &&
  value.kind === "class" &&
  isString(value.id) &&
  isString(value.name) &&
  Array.isArray(value.attributes) &&
  value.attributes.every(isAttribute) &&
  Array.isArray(value.operations) &&
  value.operations.every(isOperation) &&
  (!hasOwn(value, "packageId") || isString(value.packageId));

const isEnumerationLiteral = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ["kind", "id", "name"]) &&
  value.kind === "enumeration-literal" &&
  isString(value.id) &&
  isString(value.name);

const isEnumeration = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ["kind", "id", "name", "literals"], ["packageId"]) &&
  value.kind === "enumeration" &&
  isString(value.id) &&
  isString(value.name) &&
  Array.isArray(value.literals) &&
  value.literals.every(isEnumerationLiteral) &&
  (!hasOwn(value, "packageId") || isString(value.packageId));

const isAssociationEnd = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ["kind", "id", "classifierId", "multiplicity", "aggregation"], ["roleName"]) &&
  value.kind === "association-end" &&
  isString(value.id) &&
  isString(value.classifierId) &&
  isMultiplicity(value.multiplicity) &&
  ["none", "shared", "composite"].includes(value.aggregation as string) &&
  (!hasOwn(value, "roleName") || isString(value.roleName));

const isAssociationEnds = (value: unknown): boolean =>
  Array.isArray(value) && value.length === 2 && value.every(isAssociationEnd);

const isAssociation = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ["kind", "id", "ends"], ["name"]) &&
  value.kind === "association" &&
  isString(value.id) &&
  isAssociationEnds(value.ends) &&
  (!hasOwn(value, "name") || isString(value.name));

const isGeneralization = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ["kind", "id", "specificId", "generalId"]) &&
  value.kind === "generalization" &&
  isString(value.id) &&
  isString(value.specificId) &&
  isString(value.generalId);

const isProfile = (value: UnknownRecord): boolean =>
  hasExactKeys(value, ["kind", "classes", "attributes", "defaultSort"]) &&
  value.kind === "UpdateGenerationProfile" &&
  Array.isArray(value.classes) &&
  value.classes.every(
    (item) =>
      isRecord(item) &&
      hasExactKeys(item, ["classId"], ["entity", "auditable", "readOnly", "searchable", "crud"]) &&
      isString(item.classId) &&
      ["entity", "auditable", "readOnly", "searchable", "crud"].every(
        (key) => !hasOwn(item, key) || typeof item[key] === "boolean",
      ),
  ) &&
  Array.isArray(value.attributes) &&
  value.attributes.every(
    (item) =>
      isRecord(item) &&
      hasExactKeys(item, ["attributeId"], ["required", "unique", "sortable"]) &&
      isString(item.attributeId) &&
      ["required", "unique", "sortable"].every(
        (key) => !hasOwn(item, key) || typeof item[key] === "boolean",
      ),
  ) &&
  Array.isArray(value.defaultSort) &&
  value.defaultSort.every(
    (item) =>
      isRecord(item) &&
      hasExactKeys(item, ["classId", "attributeId", "direction"]) &&
      isString(item.classId) &&
      isString(item.attributeId) &&
      ["asc", "desc"].includes(item.direction as string),
  );

export const isUmlCommand = (value: unknown): value is UmlCommand => {
  if (!isRecord(value) || !isString(value.kind)) {
    return false;
  }

  switch (value.kind) {
    case "CreatePackage":
      return hasExactKeys(value, ["kind", "value"]) && isPackage(value.value);
    case "RenamePackage":
      return hasExactKeys(value, ["kind", "packageId", "name"]) && isString(value.packageId) && isString(value.name);
    case "DeletePackage":
      return hasExactKeys(value, ["kind", "packageId"]) && isString(value.packageId);
    case "CreateClass":
      return hasExactKeys(value, ["kind", "value"]) && isClass(value.value);
    case "RenameClass":
      return hasExactKeys(value, ["kind", "classId", "name"]) && isString(value.classId) && isString(value.name);
    case "DeleteClass":
      return hasExactKeys(value, ["kind", "classId"]) && isString(value.classId);
    case "AddAttribute":
      return hasExactKeys(value, ["kind", "classId", "value"]) && isString(value.classId) && isAttribute(value.value);
    case "UpdateAttribute":
      return hasExactKeys(value, ["kind", "classId", "attributeId", "name", "visibility", "type", "multiplicity"]) && isString(value.classId) && isString(value.attributeId) && isString(value.name) && ["public", "protected", "private", "package"].includes(value.visibility as string) && isTypeReference(value.type) && isMultiplicity(value.multiplicity);
    case "RemoveAttribute":
      return hasExactKeys(value, ["kind", "classId", "attributeId"]) && isString(value.classId) && isString(value.attributeId);
    case "AddOperation":
      return hasExactKeys(value, ["kind", "classId", "value"]) && isString(value.classId) && isOperation(value.value);
    case "UpdateOperation":
      return hasExactKeys(value, ["kind", "classId", "operationId", "name", "visibility", "parameters"], ["returnType"]) && isString(value.classId) && isString(value.operationId) && isString(value.name) && ["public", "protected", "private", "package"].includes(value.visibility as string) && Array.isArray(value.parameters) && value.parameters.every(isParameter) && (!hasOwn(value, "returnType") || isTypeReference(value.returnType));
    case "RemoveOperation":
      return hasExactKeys(value, ["kind", "classId", "operationId"]) && isString(value.classId) && isString(value.operationId);
    case "AddParameter":
      return hasExactKeys(value, ["kind", "classId", "operationId", "value"]) && isString(value.classId) && isString(value.operationId) && isParameter(value.value);
    case "UpdateParameter":
      return hasExactKeys(value, ["kind", "classId", "operationId", "parameterId", "name", "type", "multiplicity"]) && isString(value.classId) && isString(value.operationId) && isString(value.parameterId) && isString(value.name) && isTypeReference(value.type) && isMultiplicity(value.multiplicity);
    case "RemoveParameter":
      return hasExactKeys(value, ["kind", "classId", "operationId", "parameterId"]) && isString(value.classId) && isString(value.operationId) && isString(value.parameterId);
    case "CreateEnumeration":
      return hasExactKeys(value, ["kind", "value"]) && isEnumeration(value.value);
    case "RenameEnumeration":
      return hasExactKeys(value, ["kind", "enumerationId", "name"]) && isString(value.enumerationId) && isString(value.name);
    case "DeleteEnumeration":
      return hasExactKeys(value, ["kind", "enumerationId"]) && isString(value.enumerationId);
    case "AddEnumerationLiteral":
      return hasExactKeys(value, ["kind", "enumerationId", "value"]) && isString(value.enumerationId) && isEnumerationLiteral(value.value);
    case "RemoveEnumerationLiteral":
      return hasExactKeys(value, ["kind", "enumerationId", "literalId"]) && isString(value.enumerationId) && isString(value.literalId);
    case "CreateAssociation":
      return hasExactKeys(value, ["kind", "value"]) && isAssociation(value.value);
    case "UpdateAssociation":
      return hasExactKeys(value, ["kind", "associationId", "ends"], ["name"]) && isString(value.associationId) && isAssociationEnds(value.ends) && (!hasOwn(value, "name") || isString(value.name));
    case "DeleteAssociation":
      return hasExactKeys(value, ["kind", "associationId"]) && isString(value.associationId);
    case "CreateGeneralization":
      return hasExactKeys(value, ["kind", "value"]) && isGeneralization(value.value);
    case "DeleteGeneralization":
      return hasExactKeys(value, ["kind", "generalizationId"]) && isString(value.generalizationId);
    case "MoveNode":
      return hasExactKeys(value, ["kind", "elementId", "x", "y"]) && isString(value.elementId) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
    case "UpdateGenerationProfile":
      return isProfile(value);
    default:
      return false;
  }
};
