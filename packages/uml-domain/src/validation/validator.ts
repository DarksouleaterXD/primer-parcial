import { CURRENT_PROJECT_DOCUMENT_SCHEMA_VERSION } from "../document/types.js";
import type { ProjectDocument } from "../document/types.js";
import type {
  CanonicalUmlModel,
  UmlClass,
  UmlMultiplicity,
  UmlTypeReference,
} from "../model/types.js";
import type {
  ValidationDiagnostic,
  ValidationPolicy,
  ValidationResult,
} from "./types.js";

const error = (
  code: ValidationDiagnostic["code"],
  message: string,
  path: string,
  elementId?: string,
): ValidationDiagnostic => ({
  severity: "error",
  code,
  message,
  path,
  ...(elementId === undefined ? {} : { elementId }),
});

const warning = (
  code: ValidationDiagnostic["code"],
  message: string,
  path: string,
  elementId?: string,
): ValidationDiagnostic => ({
  severity: "warning",
  code,
  message,
  path,
  ...(elementId === undefined ? {} : { elementId }),
});

const sortedDiagnostics = (
  diagnostics: ValidationDiagnostic[],
): ValidationDiagnostic[] =>
  diagnostics.sort((left, right) =>
    left.path.localeCompare(right.path) ||
    left.code.localeCompare(right.code) ||
    (left.elementId ?? "").localeCompare(right.elementId ?? ""),
  );

const isNameMissing = (name: unknown): boolean =>
  typeof name !== "string" || name.trim().length === 0;

const multiplicityValid = (value: UmlMultiplicity): boolean => {
  if (!Number.isInteger(value.lower) || value.lower < 0) {
    return false;
  }
  if (value.upper === "*") {
    return true;
  }
  return (
    Number.isInteger(value.upper) &&
    value.upper >= 0 &&
    value.upper >= value.lower
  );
};

interface ElementIdentity {
  id: string;
  path: string;
}

const collectIdentities = (model: CanonicalUmlModel): ElementIdentity[] => {
  const identities: ElementIdentity[] = [];

  model.packages.forEach((item, packageIndex) => {
    identities.push({ id: item.id, path: `uml.packages[${packageIndex}]` });
  });
  model.classes.forEach((item, classIndex) => {
    identities.push({ id: item.id, path: `uml.classes[${classIndex}]` });
    item.attributes.forEach((attribute, attributeIndex) => {
      identities.push({
        id: attribute.id,
        path: `uml.classes[${classIndex}].attributes[${attributeIndex}]`,
      });
    });
    item.operations.forEach((operation, operationIndex) => {
      identities.push({
        id: operation.id,
        path: `uml.classes[${classIndex}].operations[${operationIndex}]`,
      });
      operation.parameters.forEach((parameter, parameterIndex) => {
        identities.push({
          id: parameter.id,
          path: `uml.classes[${classIndex}].operations[${operationIndex}].parameters[${parameterIndex}]`,
        });
      });
    });
  });
  model.enumerations.forEach((item, enumerationIndex) => {
    identities.push({
      id: item.id,
      path: `uml.enumerations[${enumerationIndex}]`,
    });
    item.literals.forEach((literal, literalIndex) => {
      identities.push({
        id: literal.id,
        path: `uml.enumerations[${enumerationIndex}].literals[${literalIndex}]`,
      });
    });
  });
  model.associations.forEach((item, associationIndex) => {
    identities.push({
      id: item.id,
      path: `uml.associations[${associationIndex}]`,
    });
    item.ends.forEach((end, endIndex) => {
      identities.push({
        id: end.id,
        path: `uml.associations[${associationIndex}].ends[${endIndex}]`,
      });
    });
  });
  model.generalizations.forEach((item, generalizationIndex) => {
    identities.push({
      id: item.id,
      path: `uml.generalizations[${generalizationIndex}]`,
    });
  });

  return identities;
};

const validateTypeReference = (
  reference: UmlTypeReference,
  classifierIds: Set<string>,
  path: string,
  elementId: string,
  diagnostics: ValidationDiagnostic[],
): void => {
  if (reference.kind === "classifier" && !classifierIds.has(reference.classifierId)) {
    diagnostics.push(
      error(
        "UML_REFERENCE_MISSING",
        `Classifier reference '${reference.classifierId}' does not exist.`,
        path,
        elementId,
      ),
    );
  }
};

const validateMultiplicity = (
  value: UmlMultiplicity,
  path: string,
  elementId: string,
  diagnostics: ValidationDiagnostic[],
): void => {
  if (!multiplicityValid(value)) {
    diagnostics.push(
      error(
        "UML_MULTIPLICITY_INVALID",
        "Multiplicity must use a non-negative integer lower bound and an upper bound greater than or equal to it, or '*'.",
        path,
        elementId,
      ),
    );
  }
};

const validatePackageCycles = (
  model: CanonicalUmlModel,
  diagnostics: ValidationDiagnostic[],
): void => {
  const parents = new Map(
    model.packages.map((item) => [item.id, item.parentPackageId] as const),
  );

  model.packages.forEach((item, index) => {
    const visited = new Set<string>();
    let currentId: string | undefined = item.id;
    while (currentId !== undefined) {
      if (visited.has(currentId)) {
        diagnostics.push(
          error(
            "UML_PACKAGE_CYCLE",
            "Package hierarchy contains a cycle.",
            `uml.packages[${index}].parentPackageId`,
            item.id,
          ),
        );
        return;
      }
      visited.add(currentId);
      currentId = parents.get(currentId);
    }
  });
};

const validateGeneralizationCycles = (
  model: CanonicalUmlModel,
  diagnostics: ValidationDiagnostic[],
): void => {
  const outgoing = new Map<string, string[]>();
  model.generalizations.forEach((item) => {
    const existing = outgoing.get(item.specificId) ?? [];
    existing.push(item.generalId);
    outgoing.set(item.specificId, existing);
  });

  const visit = (
    origin: string,
    current: string,
    visiting: Set<string>,
  ): boolean => {
    if (visiting.has(current)) {
      return current === origin;
    }
    const next = outgoing.get(current) ?? [];
    const nextVisiting = new Set(visiting);
    nextVisiting.add(current);
    return next.some((target) => target === origin || visit(origin, target, nextVisiting));
  };

  model.generalizations.forEach((item, index) => {
    if (
      item.specificId === item.generalId ||
      visit(item.specificId, item.generalId, new Set([item.specificId]))
    ) {
      diagnostics.push(
        error(
          "UML_GENERALIZATION_CYCLE",
          "Generalization hierarchy contains a self-reference or cycle.",
          `uml.generalizations[${index}]`,
          item.id,
        ),
      );
    }
  });
};

const validateDuplicateClassifierNames = (
  model: CanonicalUmlModel,
  diagnostics: ValidationDiagnostic[],
): void => {
  const seen = new Map<string, string>();
  const classifiers = [
    ...model.classes.map((item, index) => ({
      item,
      path: `uml.classes[${index}].name`,
      scope: item.packageId ?? "<root>",
    })),
    ...model.enumerations.map((item, index) => ({
      item,
      path: `uml.enumerations[${index}].name`,
      scope: item.packageId ?? "<root>",
    })),
  ];

  classifiers.forEach(({ item, path, scope }) => {
    if (isNameMissing(item.name)) {
      return;
    }
    const key = `${scope}\u0000${item.name.trim().toLowerCase()}`;
    const previous = seen.get(key);
    if (previous !== undefined) {
      diagnostics.push(
        warning(
          "UML_NAME_DUPLICATE",
          `Classifier name duplicates another classifier in the same package (${previous}).`,
          path,
          item.id,
        ),
      );
    } else {
      seen.set(key, item.id);
    }
  });
};

const validateClass = (
  item: UmlClass,
  classIndex: number,
  packageIds: Set<string>,
  classifierIds: Set<string>,
  diagnostics: ValidationDiagnostic[],
): void => {
  const basePath = `uml.classes[${classIndex}]`;
  if (isNameMissing(item.name)) {
    diagnostics.push(
      error("UML_NAME_REQUIRED", "Class name is required.", `${basePath}.name`, item.id),
    );
  }
  if (item.packageId !== undefined && !packageIds.has(item.packageId)) {
    diagnostics.push(
      error(
        "UML_REFERENCE_MISSING",
        `Package reference '${item.packageId}' does not exist.`,
        `${basePath}.packageId`,
        item.id,
      ),
    );
  }

  item.attributes.forEach((attribute, attributeIndex) => {
    const attributePath = `${basePath}.attributes[${attributeIndex}]`;
    if (isNameMissing(attribute.name)) {
      diagnostics.push(
        error(
          "UML_NAME_REQUIRED",
          "Attribute name is required.",
          `${attributePath}.name`,
          attribute.id,
        ),
      );
    }
    validateTypeReference(
      attribute.type,
      classifierIds,
      `${attributePath}.type`,
      attribute.id,
      diagnostics,
    );
    validateMultiplicity(
      attribute.multiplicity,
      `${attributePath}.multiplicity`,
      attribute.id,
      diagnostics,
    );
  });

  item.operations.forEach((operation, operationIndex) => {
    const operationPath = `${basePath}.operations[${operationIndex}]`;
    if (isNameMissing(operation.name)) {
      diagnostics.push(
        error(
          "UML_NAME_REQUIRED",
          "Operation name is required.",
          `${operationPath}.name`,
          operation.id,
        ),
      );
    }
    if (operation.returnType !== undefined) {
      validateTypeReference(
        operation.returnType,
        classifierIds,
        `${operationPath}.returnType`,
        operation.id,
        diagnostics,
      );
    }
    operation.parameters.forEach((parameter, parameterIndex) => {
      const parameterPath = `${operationPath}.parameters[${parameterIndex}]`;
      if (isNameMissing(parameter.name)) {
        diagnostics.push(
          error(
            "UML_NAME_REQUIRED",
            "Parameter name is required.",
            `${parameterPath}.name`,
            parameter.id,
          ),
        );
      }
      validateTypeReference(
        parameter.type,
        classifierIds,
        `${parameterPath}.type`,
        parameter.id,
        diagnostics,
      );
      validateMultiplicity(
        parameter.multiplicity,
        `${parameterPath}.multiplicity`,
        parameter.id,
        diagnostics,
      );
    });
  });
};

export const collectValidationDiagnostics = (
  document: ProjectDocument,
): ValidationDiagnostic[] => {
  try {
    const diagnostics: ValidationDiagnostic[] = [];
    const model = document.uml;

    if (document.schemaVersion !== CURRENT_PROJECT_DOCUMENT_SCHEMA_VERSION) {
      diagnostics.push(
        error(
          "DOCUMENT_VERSION_UNSUPPORTED",
          `Unsupported project document schema version '${String(document.schemaVersion)}'.`,
          "schemaVersion",
          document.id,
        ),
      );
    }

    const identities = collectIdentities(model);
    const ids = new Map<string, string>();
    identities.forEach(({ id, path }) => {
      const existing = ids.get(id);
      if (existing !== undefined) {
        diagnostics.push(
          error(
            "UML_ID_DUPLICATE",
            `ID '${id}' is already used at '${existing}'.`,
            `${path}.id`,
            id,
          ),
        );
      } else {
        ids.set(id, path);
      }
    });

    const packageIds = new Set(model.packages.map((item) => item.id));
    const classifierIds = new Set([
      ...model.classes.map((item) => item.id),
      ...model.enumerations.map((item) => item.id),
    ]);
    const classIds = new Set(model.classes.map((item) => item.id));
    const attributeOwners = new Map<string, string>();
    model.classes.forEach((item) => {
      item.attributes.forEach((attribute) => {
        attributeOwners.set(attribute.id, item.id);
      });
    });

    model.packages.forEach((item, index) => {
      const basePath = `uml.packages[${index}]`;
      if (isNameMissing(item.name)) {
        diagnostics.push(
          error(
            "UML_NAME_REQUIRED",
            "Package name is required.",
            `${basePath}.name`,
            item.id,
          ),
        );
      }
      if (
        item.parentPackageId !== undefined &&
        !packageIds.has(item.parentPackageId)
      ) {
        diagnostics.push(
          error(
            "UML_REFERENCE_MISSING",
            `Parent package reference '${item.parentPackageId}' does not exist.`,
            `${basePath}.parentPackageId`,
            item.id,
          ),
        );
      }
    });

    model.classes.forEach((item, index) => {
      validateClass(item, index, packageIds, classifierIds, diagnostics);
    });

    model.enumerations.forEach((item, index) => {
      const basePath = `uml.enumerations[${index}]`;
      if (isNameMissing(item.name)) {
        diagnostics.push(
          error(
            "UML_NAME_REQUIRED",
            "Enumeration name is required.",
            `${basePath}.name`,
            item.id,
          ),
        );
      }
      if (item.packageId !== undefined && !packageIds.has(item.packageId)) {
        diagnostics.push(
          error(
            "UML_REFERENCE_MISSING",
            `Package reference '${item.packageId}' does not exist.`,
            `${basePath}.packageId`,
            item.id,
          ),
        );
      }
      item.literals.forEach((literal, literalIndex) => {
        if (isNameMissing(literal.name)) {
          diagnostics.push(
            error(
              "UML_NAME_REQUIRED",
              "Enumeration literal name is required.",
              `${basePath}.literals[${literalIndex}].name`,
              literal.id,
            ),
          );
        }
      });
    });

    model.associations.forEach((item, associationIndex) => {
      const basePath = `uml.associations[${associationIndex}]`;
      if (!Array.isArray(item.ends) || item.ends.length !== 2) {
        diagnostics.push(
          error(
            "UML_ASSOCIATION_INVALID",
            "An association must have exactly two ends.",
            `${basePath}.ends`,
            item.id,
          ),
        );
        return;
      }

      let compositeEnds = 0;
      item.ends.forEach((end, endIndex) => {
        const endPath = `${basePath}.ends[${endIndex}]`;
        if (!classifierIds.has(end.classifierId)) {
          diagnostics.push(
            error(
              "UML_REFERENCE_MISSING",
              `Association classifier reference '${end.classifierId}' does not exist.`,
              `${endPath}.classifierId`,
              end.id,
            ),
          );
        }
        validateMultiplicity(
          end.multiplicity,
          `${endPath}.multiplicity`,
          end.id,
          diagnostics,
        );
        if (end.aggregation === "composite") {
          compositeEnds += 1;
        }
      });
      if (compositeEnds > 1) {
        diagnostics.push(
          error(
            "UML_ASSOCIATION_INVALID",
            "Only one association end can be composite in the supported subset.",
            `${basePath}.ends`,
            item.id,
          ),
        );
      }
    });

    model.generalizations.forEach((item, index) => {
      const basePath = `uml.generalizations[${index}]`;
      if (!classifierIds.has(item.specificId)) {
        diagnostics.push(
          error(
            "UML_REFERENCE_MISSING",
            `Specific classifier reference '${item.specificId}' does not exist.`,
            `${basePath}.specificId`,
            item.id,
          ),
        );
      }
      if (!classifierIds.has(item.generalId)) {
        diagnostics.push(
          error(
            "UML_REFERENCE_MISSING",
            `General classifier reference '${item.generalId}' does not exist.`,
            `${basePath}.generalId`,
            item.id,
          ),
        );
      }
    });

    validatePackageCycles(model, diagnostics);
    validateGeneralizationCycles(model, diagnostics);
    validateDuplicateClassifierNames(model, diagnostics);

    const diagrammableIds = new Set([
      ...model.packages.map((item) => item.id),
      ...model.classes.map((item) => item.id),
      ...model.enumerations.map((item) => item.id),
    ]);
    document.layout.nodes.forEach((item, index) => {
      if (!diagrammableIds.has(item.elementId)) {
        diagnostics.push(
          error(
            "LAYOUT_REFERENCE_MISSING",
            `Layout element reference '${item.elementId}' does not exist.`,
            `layout.nodes[${index}].elementId`,
            item.elementId,
          ),
        );
      }
    });

    document.generationProfile.classes.forEach((item, index) => {
      if (!classIds.has(item.classId)) {
        diagnostics.push(
          error(
            "PROFILE_REFERENCE_MISSING",
            `Profile class reference '${item.classId}' does not exist.`,
            `generationProfile.classes[${index}].classId`,
            item.classId,
          ),
        );
      }
    });

    document.generationProfile.attributes.forEach((item, index) => {
      if (!attributeOwners.has(item.attributeId)) {
        diagnostics.push(
          error(
            "PROFILE_REFERENCE_MISSING",
            `Profile attribute reference '${item.attributeId}' does not exist.`,
            `generationProfile.attributes[${index}].attributeId`,
            item.attributeId,
          ),
        );
      }
    });

    document.generationProfile.defaultSort.forEach((item, index) => {
      const basePath = `generationProfile.defaultSort[${index}]`;
      if (!classIds.has(item.classId)) {
        diagnostics.push(
          error(
            "PROFILE_REFERENCE_MISSING",
            `Default sort class reference '${item.classId}' does not exist.`,
            `${basePath}.classId`,
            item.classId,
          ),
        );
      }
      const ownerClassId = attributeOwners.get(item.attributeId);
      if (ownerClassId === undefined) {
        diagnostics.push(
          error(
            "PROFILE_REFERENCE_MISSING",
            `Default sort attribute reference '${item.attributeId}' does not exist.`,
            `${basePath}.attributeId`,
            item.attributeId,
          ),
        );
      } else if (ownerClassId !== item.classId) {
        diagnostics.push(
          error(
            "PROFILE_REFERENCE_INCOMPATIBLE",
            "Default sort attribute does not belong to the configured class.",
            `${basePath}.attributeId`,
            item.attributeId,
          ),
        );
      }
    });

    return sortedDiagnostics(diagnostics);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unknown validation failure";
    return [
      error(
        "VALIDATION_INTERNAL_ERROR",
        `Validation failed internally: ${message}`,
        "$",
      ),
    ];
  }
};

const policyBlocksErrors = (policy: ValidationPolicy): boolean =>
  policy !== "edit";

export const validateProjectDocument = (
  document: ProjectDocument,
  policy: ValidationPolicy = "save",
): ValidationResult => {
  const diagnostics = collectValidationDiagnostics(document);
  const hasErrors = diagnostics.some((item) => item.severity === "error");
  const hasInternalError = diagnostics.some(
    (item) => item.code === "VALIDATION_INTERNAL_ERROR",
  );

  return {
    policy,
    diagnostics,
    hasErrors,
    blocked: hasInternalError || (hasErrors && policyBlocksErrors(policy)),
  };
};
