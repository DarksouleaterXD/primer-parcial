import type { ProjectDocument } from "./types.js";

export interface ProjectDocumentStructureIssue {
  path: string;
  message: string;
  elementId?: string;
}

type JsonRecord = Record<string, unknown>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const VISIBILITIES = new Set(["public", "protected", "private", "package"]);
const PRIMITIVE_TYPES = new Set([
  "string",
  "integer",
  "decimal",
  "boolean",
  "date",
  "datetime",
  "uuid",
]);
const AGGREGATIONS = new Set(["none", "shared", "composite"]);
const SORT_DIRECTIONS = new Set(["asc", "desc"]);

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOwn = (value: JsonRecord, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const elementIdOf = (value: JsonRecord): string | undefined =>
  typeof value.id === "string" && UUID_PATTERN.test(value.id)
    ? value.id
    : undefined;

const pushIssue = (
  issues: ProjectDocumentStructureIssue[],
  path: string,
  message: string,
  elementId?: string,
): void => {
  issues.push({
    path,
    message,
    ...(elementId === undefined ? {} : { elementId }),
  });
};

const requireRecord = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
  elementId?: string,
): JsonRecord | undefined => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected an object.", elementId);
    return undefined;
  }
  return value;
};

const validateKeys = (
  value: JsonRecord,
  path: string,
  required: readonly string[],
  optional: readonly string[],
  issues: ProjectDocumentStructureIssue[],
  elementId?: string,
): void => {
  const allowed = new Set([...required, ...optional]);

  for (const key of required) {
    if (!hasOwn(value, key)) {
      pushIssue(issues, `${path}.${key}`, "Required property is missing.", elementId);
    }
  }

  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      pushIssue(
        issues,
        `${path}.${key}`,
        "Property is not allowed by the closed document contract.",
        elementId,
      );
    }
  }
};

const validateString = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
  elementId?: string,
): void => {
  if (typeof value !== "string") {
    pushIssue(issues, path, "Expected a string.", elementId);
  }
};

const validateUuid = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
  elementId?: string,
): void => {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    pushIssue(issues, path, "Expected a canonical UUID string.", elementId);
  }
};

const validateTimestamp = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  if (
    typeof value !== "string" ||
    !ISO_TIMESTAMP_PATTERN.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  ) {
    pushIssue(
      issues,
      path,
      "Expected a canonical ISO-8601 UTC timestamp with milliseconds.",
    );
  }
};

const validateBoolean = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  if (typeof value !== "boolean") {
    pushIssue(issues, path, "Expected a boolean.");
  }
};

const validateFiniteNumber = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    pushIssue(issues, path, "Expected a finite number.");
  }
};

const validateNonNegativeInteger = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
  elementId?: string,
): void => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    pushIssue(issues, path, "Expected a non-negative integer.", elementId);
  }
};

const validateEnum = (
  value: unknown,
  allowed: ReadonlySet<string>,
  path: string,
  description: string,
  issues: ProjectDocumentStructureIssue[],
  elementId?: string,
): void => {
  if (typeof value !== "string" || !allowed.has(value)) {
    pushIssue(issues, path, `Expected ${description}.`, elementId);
  }
};

const validateMultiplicity = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
  elementId?: string,
): void => {
  const record = requireRecord(value, path, issues, elementId);
  if (record === undefined) {
    return;
  }

  validateKeys(record, path, ["lower", "upper"], [], issues, elementId);
  validateNonNegativeInteger(record.lower, `${path}.lower`, issues, elementId);

  if (
    record.upper !== "*" &&
    (typeof record.upper !== "number" ||
      !Number.isInteger(record.upper) ||
      record.upper < 0)
  ) {
    pushIssue(
      issues,
      `${path}.upper`,
      "Expected a non-negative integer or '*'.",
      elementId,
    );
  }
};

const validateTypeReference = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
  elementId?: string,
): void => {
  const record = requireRecord(value, path, issues, elementId);
  if (record === undefined) {
    return;
  }

  if (record.kind === "primitive") {
    validateKeys(record, path, ["kind", "name"], [], issues, elementId);
    validateEnum(
      record.name,
      PRIMITIVE_TYPES,
      `${path}.name`,
      "a supported primitive type",
      issues,
      elementId,
    );
    return;
  }

  if (record.kind === "classifier") {
    validateKeys(record, path, ["kind", "classifierId"], [], issues, elementId);
    validateUuid(
      record.classifierId,
      `${path}.classifierId`,
      issues,
      elementId,
    );
    return;
  }

  validateKeys(
    record,
    path,
    ["kind"],
    ["name", "classifierId"],
    issues,
    elementId,
  );
  pushIssue(
    issues,
    `${path}.kind`,
    "Expected type reference kind 'primitive' or 'classifier'.",
    elementId,
  );
};

const validatePackage = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  const elementId = elementIdOf(record);
  validateKeys(record, path, ["kind", "id", "name"], ["parentPackageId"], issues, elementId);
  validateEnum(record.kind, new Set(["package"]), `${path}.kind`, "'package'", issues, elementId);
  validateUuid(record.id, `${path}.id`, issues);
  validateString(record.name, `${path}.name`, issues, elementId);
  if (hasOwn(record, "parentPackageId")) {
    validateUuid(record.parentPackageId, `${path}.parentPackageId`, issues, elementId);
  }
};

const validateAttribute = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  const elementId = elementIdOf(record);
  validateKeys(
    record,
    path,
    ["kind", "id", "name", "visibility", "type", "multiplicity"],
    [],
    issues,
    elementId,
  );
  validateEnum(record.kind, new Set(["attribute"]), `${path}.kind`, "'attribute'", issues, elementId);
  validateUuid(record.id, `${path}.id`, issues);
  validateString(record.name, `${path}.name`, issues, elementId);
  validateEnum(record.visibility, VISIBILITIES, `${path}.visibility`, "a supported UML visibility", issues, elementId);
  validateTypeReference(record.type, `${path}.type`, issues, elementId);
  validateMultiplicity(record.multiplicity, `${path}.multiplicity`, issues, elementId);
};

const validateParameter = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  const elementId = elementIdOf(record);
  validateKeys(record, path, ["kind", "id", "name", "type", "multiplicity"], [], issues, elementId);
  validateEnum(record.kind, new Set(["parameter"]), `${path}.kind`, "'parameter'", issues, elementId);
  validateUuid(record.id, `${path}.id`, issues);
  validateString(record.name, `${path}.name`, issues, elementId);
  validateTypeReference(record.type, `${path}.type`, issues, elementId);
  validateMultiplicity(record.multiplicity, `${path}.multiplicity`, issues, elementId);
};

const validateOperation = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  const elementId = elementIdOf(record);
  validateKeys(
    record,
    path,
    ["kind", "id", "name", "visibility", "parameters"],
    ["returnType"],
    issues,
    elementId,
  );
  validateEnum(record.kind, new Set(["operation"]), `${path}.kind`, "'operation'", issues, elementId);
  validateUuid(record.id, `${path}.id`, issues);
  validateString(record.name, `${path}.name`, issues, elementId);
  validateEnum(record.visibility, VISIBILITIES, `${path}.visibility`, "a supported UML visibility", issues, elementId);

  if (!Array.isArray(record.parameters)) {
    pushIssue(issues, `${path}.parameters`, "Expected an array.", elementId);
  } else {
    record.parameters.forEach((item, index) =>
      validateParameter(item, `${path}.parameters[${index}]`, issues),
    );
  }

  if (hasOwn(record, "returnType")) {
    validateTypeReference(record.returnType, `${path}.returnType`, issues, elementId);
  }
};

const validateClass = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  const elementId = elementIdOf(record);
  validateKeys(
    record,
    path,
    ["kind", "id", "name", "attributes", "operations"],
    ["packageId"],
    issues,
    elementId,
  );
  validateEnum(record.kind, new Set(["class"]), `${path}.kind`, "'class'", issues, elementId);
  validateUuid(record.id, `${path}.id`, issues);
  validateString(record.name, `${path}.name`, issues, elementId);
  if (hasOwn(record, "packageId")) {
    validateUuid(record.packageId, `${path}.packageId`, issues, elementId);
  }

  if (!Array.isArray(record.attributes)) {
    pushIssue(issues, `${path}.attributes`, "Expected an array.", elementId);
  } else {
    record.attributes.forEach((item, index) =>
      validateAttribute(item, `${path}.attributes[${index}]`, issues),
    );
  }

  if (!Array.isArray(record.operations)) {
    pushIssue(issues, `${path}.operations`, "Expected an array.", elementId);
  } else {
    record.operations.forEach((item, index) =>
      validateOperation(item, `${path}.operations[${index}]`, issues),
    );
  }
};

const validateEnumerationLiteral = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  const elementId = elementIdOf(record);
  validateKeys(record, path, ["kind", "id", "name"], [], issues, elementId);
  validateEnum(
    record.kind,
    new Set(["enumeration-literal"]),
    `${path}.kind`,
    "'enumeration-literal'",
    issues,
    elementId,
  );
  validateUuid(record.id, `${path}.id`, issues);
  validateString(record.name, `${path}.name`, issues, elementId);
};

const validateEnumeration = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  const elementId = elementIdOf(record);
  validateKeys(record, path, ["kind", "id", "name", "literals"], ["packageId"], issues, elementId);
  validateEnum(record.kind, new Set(["enumeration"]), `${path}.kind`, "'enumeration'", issues, elementId);
  validateUuid(record.id, `${path}.id`, issues);
  validateString(record.name, `${path}.name`, issues, elementId);
  if (hasOwn(record, "packageId")) {
    validateUuid(record.packageId, `${path}.packageId`, issues, elementId);
  }
  if (!Array.isArray(record.literals)) {
    pushIssue(issues, `${path}.literals`, "Expected an array.", elementId);
  } else {
    record.literals.forEach((item, index) =>
      validateEnumerationLiteral(item, `${path}.literals[${index}]`, issues),
    );
  }
};

const validateAssociationEnd = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  const elementId = elementIdOf(record);
  validateKeys(
    record,
    path,
    ["kind", "id", "classifierId", "multiplicity", "aggregation"],
    ["roleName"],
    issues,
    elementId,
  );
  validateEnum(record.kind, new Set(["association-end"]), `${path}.kind`, "'association-end'", issues, elementId);
  validateUuid(record.id, `${path}.id`, issues);
  validateUuid(record.classifierId, `${path}.classifierId`, issues, elementId);
  if (hasOwn(record, "roleName")) {
    validateString(record.roleName, `${path}.roleName`, issues, elementId);
  }
  validateMultiplicity(record.multiplicity, `${path}.multiplicity`, issues, elementId);
  validateEnum(record.aggregation, AGGREGATIONS, `${path}.aggregation`, "a supported aggregation kind", issues, elementId);
};

const validateAssociation = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  const elementId = elementIdOf(record);
  validateKeys(record, path, ["kind", "id", "ends"], ["name"], issues, elementId);
  validateEnum(record.kind, new Set(["association"]), `${path}.kind`, "'association'", issues, elementId);
  validateUuid(record.id, `${path}.id`, issues);
  if (hasOwn(record, "name")) {
    validateString(record.name, `${path}.name`, issues, elementId);
  }
  if (!Array.isArray(record.ends)) {
    pushIssue(issues, `${path}.ends`, "Expected an array.", elementId);
  } else {
    if (record.ends.length !== 2) {
      pushIssue(issues, `${path}.ends`, "Expected exactly two association ends.", elementId);
    }
    record.ends.forEach((item, index) =>
      validateAssociationEnd(item, `${path}.ends[${index}]`, issues),
    );
  }
};

const validateGeneralization = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  const elementId = elementIdOf(record);
  validateKeys(record, path, ["kind", "id", "specificId", "generalId"], [], issues, elementId);
  validateEnum(record.kind, new Set(["generalization"]), `${path}.kind`, "'generalization'", issues, elementId);
  validateUuid(record.id, `${path}.id`, issues);
  validateUuid(record.specificId, `${path}.specificId`, issues, elementId);
  validateUuid(record.generalId, `${path}.generalId`, issues, elementId);
};

const validateCanonicalModel = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  validateKeys(
    record,
    path,
    ["packages", "classes", "enumerations", "associations", "generalizations"],
    [],
    issues,
  );

  const collections: Array<
    [string, (value: unknown, path: string, issues: ProjectDocumentStructureIssue[]) => void]
  > = [
    ["packages", validatePackage],
    ["classes", validateClass],
    ["enumerations", validateEnumeration],
    ["associations", validateAssociation],
    ["generalizations", validateGeneralization],
  ];

  for (const [key, validator] of collections) {
    const collection = record[key];
    if (!Array.isArray(collection)) {
      pushIssue(issues, `${path}.${key}`, "Expected an array.");
      continue;
    }
    collection.forEach((item, index) =>
      validator(item, `${path}.${key}[${index}]`, issues),
    );
  }
};

const validateDiagramLayout = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  validateKeys(record, path, ["nodes"], [], issues);
  if (!Array.isArray(record.nodes)) {
    pushIssue(issues, `${path}.nodes`, "Expected an array.");
    return;
  }

  record.nodes.forEach((item, index) => {
    const itemPath = `${path}.nodes[${index}]`;
    const node = requireRecord(item, itemPath, issues);
    if (node === undefined) {
      return;
    }
    validateKeys(node, itemPath, ["elementId", "x", "y"], [], issues);
    validateUuid(node.elementId, `${itemPath}.elementId`, issues);
    validateFiniteNumber(node.x, `${itemPath}.x`, issues);
    validateFiniteNumber(node.y, `${itemPath}.y`, issues);
  });
};

const validateClassGenerationProfile = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  validateKeys(
    record,
    path,
    ["classId"],
    ["entity", "auditable", "readOnly", "searchable", "crud"],
    issues,
  );
  validateUuid(record.classId, `${path}.classId`, issues);
  for (const key of ["entity", "auditable", "readOnly", "searchable", "crud"]) {
    if (hasOwn(record, key)) {
      validateBoolean(record[key], `${path}.${key}`, issues);
    }
  }
};

const validateAttributeGenerationProfile = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  validateKeys(
    record,
    path,
    ["attributeId"],
    ["required", "unique", "sortable"],
    issues,
  );
  validateUuid(record.attributeId, `${path}.attributeId`, issues);
  for (const key of ["required", "unique", "sortable"]) {
    if (hasOwn(record, key)) {
      validateBoolean(record[key], `${path}.${key}`, issues);
    }
  }
};

const validateDefaultSortProfile = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  validateKeys(record, path, ["classId", "attributeId", "direction"], [], issues);
  validateUuid(record.classId, `${path}.classId`, issues);
  validateUuid(record.attributeId, `${path}.attributeId`, issues);
  validateEnum(record.direction, SORT_DIRECTIONS, `${path}.direction`, "'asc' or 'desc'", issues);
};

const validateGenerationProfile = (
  value: unknown,
  path: string,
  issues: ProjectDocumentStructureIssue[],
): void => {
  const record = requireRecord(value, path, issues);
  if (record === undefined) {
    return;
  }
  validateKeys(record, path, ["classes", "attributes", "defaultSort"], [], issues);

  const collections: Array<
    [string, (value: unknown, path: string, issues: ProjectDocumentStructureIssue[]) => void]
  > = [
    ["classes", validateClassGenerationProfile],
    ["attributes", validateAttributeGenerationProfile],
    ["defaultSort", validateDefaultSortProfile],
  ];

  for (const [key, validator] of collections) {
    const collection = record[key];
    if (!Array.isArray(collection)) {
      pushIssue(issues, `${path}.${key}`, "Expected an array.");
      continue;
    }
    collection.forEach((item, index) =>
      validator(item, `${path}.${key}[${index}]`, issues),
    );
  }
};

export const collectProjectDocumentStructureIssues = (
  value: unknown,
): ProjectDocumentStructureIssue[] => {
  const issues: ProjectDocumentStructureIssue[] = [];
  const document = requireRecord(value, "$", issues);
  if (document === undefined) {
    return issues;
  }

  validateKeys(
    document,
    "$",
    [
      "schemaVersion",
      "id",
      "name",
      "ownerId",
      "revision",
      "createdAt",
      "updatedAt",
      "uml",
      "layout",
      "generationProfile",
    ],
    [],
    issues,
  );

  if (
    typeof document.schemaVersion !== "number" ||
    !Number.isInteger(document.schemaVersion)
  ) {
    pushIssue(issues, "schemaVersion", "Expected an integer schema version.");
  }

  validateUuid(document.id, "id", issues);
  validateString(document.name, "name", issues);
  validateUuid(document.ownerId, "ownerId", issues);
  validateNonNegativeInteger(document.revision, "revision", issues);
  validateTimestamp(document.createdAt, "createdAt", issues);
  validateTimestamp(document.updatedAt, "updatedAt", issues);
  validateCanonicalModel(document.uml, "uml", issues);
  validateDiagramLayout(document.layout, "layout", issues);
  validateGenerationProfile(document.generationProfile, "generationProfile", issues);

  return issues.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.message.localeCompare(right.message) ||
      (left.elementId ?? "").localeCompare(right.elementId ?? ""),
  );
};

export const isProjectDocumentStructureValid = (
  value: unknown,
): value is ProjectDocument =>
  collectProjectDocumentStructureIssues(value).length === 0;

