import type { ProjectDocument } from "../document/types.js";
import type {
  CanonicalUmlModel,
  UmlAssociation,
  UmlClass,
  UmlEnumeration,
  UmlOperation,
  UmlTypeReference,
} from "../model/types.js";
import type { GenerationProfile } from "../profile/types.js";
import { isUmlCommand } from "./runtime-validation.js";
import type { UmlCommand, UmlCommandPreconditionCode, UmlCommandResult } from "./types.js";

const rejected = (code: UmlCommandPreconditionCode): UmlCommandResult => ({
  kind: "rejected",
  error: { kind: "precondition-failed", code },
});
const unsupported = (): UmlCommandResult => ({
  kind: "rejected", error: { kind: "unsupported-command" } });
const accepted = (document: ProjectDocument): UmlCommandResult => ({ kind: "accepted", document });
const named = (value: string): string => value.trim().toLowerCase();

const clone = <Value>(value: Value): Value => JSON.parse(JSON.stringify(value)) as Value;
const replace = <Value extends { id: string }>(items: readonly Value[], id: string, value: Value): Value[] =>
  items.map((item) => (item.id === id ? value : item));
const without = <Value extends { id: string }>(items: readonly Value[], id: string): Value[] =>
  items.filter((item) => item.id !== id);

const idsOf = (model: CanonicalUmlModel): Set<string> => {
  const ids = new Set<string>();
  for (const item of model.packages) ids.add(item.id);
  for (const item of model.classes) {
    ids.add(item.id);
    for (const attribute of item.attributes) ids.add(attribute.id);
    for (const operation of item.operations) {
      ids.add(operation.id);
      for (const parameter of operation.parameters) ids.add(parameter.id);
    }
  }
  for (const item of model.enumerations) {
    ids.add(item.id);
    for (const literal of item.literals) ids.add(literal.id);
  }
  for (const item of model.associations) {
    ids.add(item.id);
    for (const end of item.ends) ids.add(end.id);
  }
  for (const item of model.generalizations) ids.add(item.id);
  return ids;
};
const hasDuplicateIds = (ids: readonly string[]): boolean => new Set(ids).size !== ids.length;
const classifierIds = (model: CanonicalUmlModel): Set<string> =>
  new Set([...model.classes, ...model.enumerations].map((item) => item.id));
const typeCompatible = (model: CanonicalUmlModel, reference: UmlTypeReference | undefined): boolean =>
  reference === undefined || reference.kind === "primitive" || classifierIds(model).has(reference.classifierId);
const allTypesCompatible = (model: CanonicalUmlModel, item: UmlClass): boolean =>
  item.attributes.every((attribute) => typeCompatible(model, attribute.type)) &&
  item.operations.every((operation) =>
    typeCompatible(model, operation.returnType) && operation.parameters.every((parameter) => typeCompatible(model, parameter.type)),
  );
const associationCompatible = (model: CanonicalUmlModel, association: UmlAssociation): boolean =>
  association.ends.every((end) => classifierIds(model).has(end.classifierId));
const profileCompatible = (model: CanonicalUmlModel, profile: GenerationProfile): boolean => {
  const classes = new Set(model.classes.map((item) => item.id));
  const owners = new Map<string, string>();
  model.classes.forEach((item) => item.attributes.forEach((attribute) => owners.set(attribute.id, item.id)));
  return profile.classes.every((item) => classes.has(item.classId)) &&
    profile.attributes.every((item) => owners.has(item.attributeId)) &&
    profile.defaultSort.every((item) => owners.get(item.attributeId) === item.classId);
};
const candidate = (current: ProjectDocument, uml: CanonicalUmlModel = current.uml, layout = current.layout, generationProfile = current.generationProfile): ProjectDocument => ({
  ...clone(current),
  uml: clone(uml),
  layout: clone(layout),
  generationProfile: clone(generationProfile),
});
const classifierNameExists = (model: CanonicalUmlModel, name: string, packageId: string | undefined, ignored?: string): boolean =>
  [...model.classes, ...model.enumerations].some((item) => item.id !== ignored && item.packageId === packageId && named(item.name) === named(name));
const packageNameExists = (model: CanonicalUmlModel, name: string, parentPackageId: string | undefined, ignored?: string): boolean =>
  model.packages.some((item) => item.id !== ignored && item.parentPackageId === parentPackageId && named(item.name) === named(name));
const associationNameExists = (model: CanonicalUmlModel, name: string | undefined, ignored?: string): boolean =>
  name !== undefined && name.length > 0 && model.associations.some((item) => item.id !== ignored && item.name !== undefined && item.name.length > 0 && named(item.name) === named(name));
const memberNameExists = <Value extends { id: string; name: string }>(items: readonly Value[], name: string, ignored?: string): boolean =>
  items.some((item) => item.id !== ignored && named(item.name) === named(name));
const hasProfileReference = (profile: GenerationProfile, id: string): boolean =>
  profile.classes.some((item) => item.classId === id) ||
  profile.attributes.some((item) => item.attributeId === id) ||
  profile.defaultSort.some((item) => item.classId === id || item.attributeId === id);
const hasLayoutReference = (document: ProjectDocument, id: string): boolean =>
  document.layout.nodes.some((item) => item.elementId === id);
const findClass = (model: CanonicalUmlModel, id: string): UmlClass | undefined => model.classes.find((item) => item.id === id);
const findEnumeration = (model: CanonicalUmlModel, id: string): UmlEnumeration | undefined => model.enumerations.find((item) => item.id === id);

/** Internal command candidate builder. The public stateful bus is introduced in Block 3. */
export const executeUmlCommand = (current: ProjectDocument, input: unknown): UmlCommandResult => {
  if (!isUmlCommand(input)) return unsupported();
  const command: UmlCommand = input;
  const model = current.uml;
  const allIds = idsOf(model);
  const idAvailable = (...ids: string[]): boolean => !hasDuplicateIds(ids) && ids.every((id) => !allIds.has(id));

  switch (command.kind) {
    case "CreatePackage": {
      const value = { kind: "package" as const, ...clone(command.value), ...(command.parentPackageId === null ? {} : { parentPackageId: command.parentPackageId }) };
      if (command.parentPackageId !== null && !model.packages.some((item) => item.id === command.parentPackageId)) return rejected("PARENT_NOT_FOUND");
      if (!idAvailable(value.id)) return rejected("DUPLICATE_ID");
      if (packageNameExists(model, value.name, value.parentPackageId)) return rejected("DUPLICATE_NAME");
      return accepted(candidate(current, { ...model, packages: [...model.packages, value] }));
    }
    case "RenamePackage": {
      const target = model.packages.find((item) => item.id === command.packageId);
      if (target === undefined) return rejected("TARGET_NOT_FOUND");
      if (packageNameExists(model, command.name, target.parentPackageId, target.id)) return rejected("DUPLICATE_NAME");
      return accepted(candidate(current, { ...model, packages: replace(model.packages, target.id, { ...target, name: command.name }) }));
    }
    case "DeletePackage": {
      const target = model.packages.find((item) => item.id === command.packageId);
      if (target === undefined) return rejected("TARGET_NOT_FOUND");
      if (model.packages.some((item) => item.parentPackageId === target.id) || model.classes.some((item) => item.packageId === target.id) || model.enumerations.some((item) => item.packageId === target.id)) return rejected("DEPENDENCIES_EXIST");
      return accepted(candidate(current, { ...model, packages: without(model.packages, target.id) }));
    }
    case "CreateClass": {
      if (!model.packages.some((item) => item.id === command.packageId)) return rejected("PARENT_NOT_FOUND");
      const value: UmlClass = { kind: "class", ...clone(command.value), packageId: command.packageId, attributes: [], operations: [] };
      const nestedIds = [value.id, ...value.attributes.map((item) => item.id), ...value.operations.flatMap((item) => [item.id, ...item.parameters.map((parameter) => parameter.id)])];
      if (!idAvailable(...nestedIds)) return rejected("DUPLICATE_ID");
      if (classifierNameExists(model, value.name, value.packageId)) return rejected("DUPLICATE_NAME");
      if (hasDuplicateIds(value.attributes.map((item) => named(item.name))) || hasDuplicateIds(value.operations.map((item) => named(item.name))) || value.operations.some((item) => hasDuplicateIds(item.parameters.map((parameter) => named(parameter.name))))) return rejected("DUPLICATE_NAME");
      if (!allTypesCompatible({ ...model, classes: [...model.classes, value] }, value)) return rejected("INCOMPATIBLE_REFERENCE");
      return accepted(candidate(current, { ...model, classes: [...model.classes, value] }));
    }
    case "RenameClass": {
      const target = findClass(model, command.classId);
      if (target === undefined) return rejected("TARGET_NOT_FOUND");
      if (classifierNameExists(model, command.name, target.packageId, target.id)) return rejected("DUPLICATE_NAME");
      return accepted(candidate(current, { ...model, classes: replace(model.classes, target.id, { ...target, name: command.name }) }));
    }
    case "DeleteClass": {
      const target = findClass(model, command.classId);
      if (target === undefined) return rejected("TARGET_NOT_FOUND");
      const referenced = model.classes.some((item) => item.attributes.some((attribute) => attribute.type.kind === "classifier" && attribute.type.classifierId === target.id) || item.operations.some((operation) => (operation.returnType?.kind === "classifier" && operation.returnType.classifierId === target.id) || operation.parameters.some((parameter) => parameter.type.kind === "classifier" && parameter.type.classifierId === target.id))) || model.associations.some((item) => item.ends.some((end) => end.classifierId === target.id)) || model.generalizations.some((item) => item.specificId === target.id || item.generalId === target.id);
      if (target.attributes.length > 0 || target.operations.length > 0 || referenced || hasLayoutReference(current, target.id) || hasProfileReference(current.generationProfile, target.id) || target.attributes.some((item) => hasProfileReference(current.generationProfile, item.id))) return rejected("DEPENDENCIES_EXIST");
      return accepted(candidate(current, { ...model, classes: without(model.classes, target.id) }));
    }
    case "AddAttribute": {
      const owner = findClass(model, command.classId); if (owner === undefined) return rejected("PARENT_NOT_FOUND");
      const value = { kind: "attribute" as const, ...clone(command.value) }; if (!idAvailable(value.id)) return rejected("DUPLICATE_ID");
      if (memberNameExists(owner.attributes, value.name)) return rejected("DUPLICATE_NAME");
      if (!typeCompatible(model, value.type)) return rejected("INCOMPATIBLE_REFERENCE");
      return accepted(candidate(current, { ...model, classes: replace(model.classes, owner.id, { ...owner, attributes: [...owner.attributes, value] }) }));
    }
    case "UpdateAttribute": case "RemoveAttribute": {
      const owner = findClass(model, command.classId); if (owner === undefined) return rejected("PARENT_NOT_FOUND");
      const target = model.classes.flatMap((item) => item.attributes.map((attribute) => ({ item, attribute }))).find((item) => item.attribute.id === command.attributeId);
      if (target === undefined) return rejected("TARGET_NOT_FOUND"); if (target.item.id !== owner.id) return rejected("PARENT_MISMATCH");
      if (command.kind === "RemoveAttribute") {
        if (hasProfileReference(current.generationProfile, target.attribute.id)) return rejected("DEPENDENCIES_EXIST");
        return accepted(candidate(current, { ...model, classes: replace(model.classes, owner.id, { ...owner, attributes: without(owner.attributes, target.attribute.id) }) }));
      }
      if (memberNameExists(owner.attributes, command.name, target.attribute.id)) return rejected("DUPLICATE_NAME");
      if (!typeCompatible(model, command.type)) return rejected("INCOMPATIBLE_REFERENCE");
      const value = { ...target.attribute, name: command.name, visibility: command.visibility, type: clone(command.type), multiplicity: clone(command.multiplicity) };
      return accepted(candidate(current, { ...model, classes: replace(model.classes, owner.id, { ...owner, attributes: replace(owner.attributes, target.attribute.id, value) }) }));
    }
    case "AddOperation": {
      const owner = findClass(model, command.classId); if (owner === undefined) return rejected("PARENT_NOT_FOUND"); const value: UmlOperation = { kind: "operation", ...clone(command.value), parameters: command.value.parameters.map((parameter) => ({ kind: "parameter", ...clone(parameter) })) };
      if (!idAvailable(value.id, ...value.parameters.map((item) => item.id))) return rejected("DUPLICATE_ID");
      if (memberNameExists(owner.operations, value.name) || hasDuplicateIds(value.parameters.map((item) => named(item.name)))) return rejected("DUPLICATE_NAME");
      if (!typeCompatible(model, value.returnType) || value.parameters.some((item) => !typeCompatible(model, item.type))) return rejected("INCOMPATIBLE_REFERENCE");
      return accepted(candidate(current, { ...model, classes: replace(model.classes, owner.id, { ...owner, operations: [...owner.operations, value] }) }));
    }
    case "UpdateOperation": case "RemoveOperation": {
      const owner = findClass(model, command.classId); if (owner === undefined) return rejected("PARENT_NOT_FOUND");
      const found = model.classes.flatMap((item) => item.operations.map((operation) => ({ item, operation }))).find((item) => item.operation.id === command.operationId);
      if (found === undefined) return rejected("TARGET_NOT_FOUND"); if (found.item.id !== owner.id) return rejected("PARENT_MISMATCH");
      if (command.kind === "RemoveOperation") {
        if (found.operation.parameters.length > 0) return rejected("DEPENDENCIES_EXIST");
        return accepted(candidate(current, { ...model, classes: replace(model.classes, owner.id, { ...owner, operations: without(owner.operations, found.operation.id) }) }));
      }
      const newIds = command.parameters.map((item) => item.id);
      const retained = new Set(found.operation.parameters.map((item) => item.id));
      if (hasDuplicateIds(newIds) || newIds.some((item) => !retained.has(item) && allIds.has(item))) return rejected("DUPLICATE_ID");
      if (memberNameExists(owner.operations, command.name, found.operation.id) || hasDuplicateIds(command.parameters.map((item) => named(item.name)))) return rejected("DUPLICATE_NAME");
      if (!typeCompatible(model, command.returnType) || command.parameters.some((item) => !typeCompatible(model, item.type))) return rejected("INCOMPATIBLE_REFERENCE");
      const value: UmlOperation = { kind: "operation", id: found.operation.id, name: command.name, visibility: command.visibility, parameters: clone(command.parameters), ...(command.returnType === undefined ? {} : { returnType: clone(command.returnType) }) };
      return accepted(candidate(current, { ...model, classes: replace(model.classes, owner.id, { ...owner, operations: replace(owner.operations, value.id, value) }) }));
    }
    case "AddParameter": {
      const owner = findClass(model, command.classId); if (owner === undefined) return rejected("PARENT_NOT_FOUND"); const operation = owner.operations.find((item) => item.id === command.operationId);
      if (operation === undefined) return model.classes.some((item) => item.operations.some((candidate) => candidate.id === command.operationId)) ? rejected("PARENT_MISMATCH") : rejected("TARGET_NOT_FOUND");
      const value = { kind: "parameter" as const, ...clone(command.value) }; if (!idAvailable(value.id)) return rejected("DUPLICATE_ID"); if (memberNameExists(operation.parameters, value.name)) return rejected("DUPLICATE_NAME"); if (!typeCompatible(model, value.type)) return rejected("INCOMPATIBLE_REFERENCE");
      return accepted(candidate(current, { ...model, classes: replace(model.classes, owner.id, { ...owner, operations: replace(owner.operations, operation.id, { ...operation, parameters: [...operation.parameters, value] }) }) }));
    }
    case "UpdateParameter": case "RemoveParameter": {
      const owner = findClass(model, command.classId); if (owner === undefined) return rejected("PARENT_NOT_FOUND"); const operation = owner.operations.find((item) => item.id === command.operationId);
      if (operation === undefined) return model.classes.some((item) => item.operations.some((candidate) => candidate.id === command.operationId)) ? rejected("PARENT_MISMATCH") : rejected("TARGET_NOT_FOUND");
      const located = model.classes.flatMap((item) => item.operations.flatMap((candidate) => candidate.parameters.map((parameter) => ({ item, candidate, parameter })))).find((item) => item.parameter.id === command.parameterId);
      if (located === undefined) return rejected("TARGET_NOT_FOUND"); if (located.item.id !== owner.id || located.candidate.id !== operation.id) return rejected("PARENT_MISMATCH");
      if (command.kind === "RemoveParameter") { if (hasLayoutReference(current, located.parameter.id) || hasProfileReference(current.generationProfile, located.parameter.id)) return rejected("DEPENDENCIES_EXIST"); return accepted(candidate(current, { ...model, classes: replace(model.classes, owner.id, { ...owner, operations: replace(owner.operations, operation.id, { ...operation, parameters: without(operation.parameters, located.parameter.id) }) }) })); }
      if (memberNameExists(operation.parameters, command.name, located.parameter.id)) return rejected("DUPLICATE_NAME"); if (!typeCompatible(model, command.type)) return rejected("INCOMPATIBLE_REFERENCE");
      const value = { ...located.parameter, name: command.name, type: clone(command.type), multiplicity: clone(command.multiplicity) };
      return accepted(candidate(current, { ...model, classes: replace(model.classes, owner.id, { ...owner, operations: replace(owner.operations, operation.id, { ...operation, parameters: replace(operation.parameters, value.id, value) }) }) }));
    }
    case "CreateEnumeration": {
      if (!model.packages.some((item) => item.id === command.packageId)) return rejected("PARENT_NOT_FOUND"); const value: UmlEnumeration = { kind: "enumeration", ...clone(command.value), packageId: command.packageId, literals: [] }; if (!idAvailable(value.id, ...value.literals.map((item) => item.id))) return rejected("DUPLICATE_ID"); if (classifierNameExists(model, value.name, value.packageId) || hasDuplicateIds(value.literals.map((item) => named(item.name)))) return rejected("DUPLICATE_NAME");
      return accepted(candidate(current, { ...model, enumerations: [...model.enumerations, value] }));
    }
    case "RenameEnumeration": {
      const target = findEnumeration(model, command.enumerationId); if (target === undefined) return rejected("TARGET_NOT_FOUND"); if (classifierNameExists(model, command.name, target.packageId, target.id)) return rejected("DUPLICATE_NAME"); return accepted(candidate(current, { ...model, enumerations: replace(model.enumerations, target.id, { ...target, name: command.name }) }));
    }
    case "DeleteEnumeration": {
      const target = findEnumeration(model, command.enumerationId); if (target === undefined) return rejected("TARGET_NOT_FOUND");
      const referenced = model.classes.some((item) => item.attributes.some((attribute) => attribute.type.kind === "classifier" && attribute.type.classifierId === target.id) || item.operations.some((operation) => (operation.returnType?.kind === "classifier" && operation.returnType.classifierId === target.id) || operation.parameters.some((parameter) => parameter.type.kind === "classifier" && parameter.type.classifierId === target.id))) || model.associations.some((item) => item.ends.some((end) => end.classifierId === target.id)) || model.generalizations.some((item) => item.specificId === target.id || item.generalId === target.id);
      if (target.literals.length > 0 || referenced || hasLayoutReference(current, target.id) || hasProfileReference(current.generationProfile, target.id)) return rejected("DEPENDENCIES_EXIST"); return accepted(candidate(current, { ...model, enumerations: without(model.enumerations, target.id) }));
    }
    case "AddEnumerationLiteral": {
      const owner = findEnumeration(model, command.enumerationId); if (owner === undefined) return rejected("PARENT_NOT_FOUND"); const value = { kind: "enumeration-literal" as const, ...clone(command.value) }; if (!idAvailable(value.id)) return rejected("DUPLICATE_ID"); if (memberNameExists(owner.literals, value.name)) return rejected("DUPLICATE_NAME"); return accepted(candidate(current, { ...model, enumerations: replace(model.enumerations, owner.id, { ...owner, literals: [...owner.literals, value] }) }));
    }
    case "RemoveEnumerationLiteral": {
      const owner = findEnumeration(model, command.enumerationId); if (owner === undefined) return rejected("PARENT_NOT_FOUND"); const target = model.enumerations.flatMap((item) => item.literals.map((literal) => ({ item, literal }))).find((item) => item.literal.id === command.literalId); if (target === undefined) return rejected("TARGET_NOT_FOUND"); if (target.item.id !== owner.id) return rejected("PARENT_MISMATCH"); if (hasLayoutReference(current, target.literal.id) || hasProfileReference(current.generationProfile, target.literal.id)) return rejected("DEPENDENCIES_EXIST"); return accepted(candidate(current, { ...model, enumerations: replace(model.enumerations, owner.id, { ...owner, literals: without(owner.literals, target.literal.id) }) }));
    }
    case "CreateAssociation": {
      const value: UmlAssociation = { kind: "association", ...clone(command.value), ends: command.value.ends.map((end) => ({ kind: "association-end", ...clone(end) })) as UmlAssociation["ends"] }; if (!idAvailable(value.id, ...value.ends.map((item) => item.id))) return rejected("DUPLICATE_ID"); if (associationNameExists(model, value.name)) return rejected("DUPLICATE_NAME"); if (!associationCompatible(model, value)) return rejected("INCOMPATIBLE_REFERENCE"); return accepted(candidate(current, { ...model, associations: [...model.associations, value] }));
    }
    case "UpdateAssociation": {
      const target = model.associations.find((item) => item.id === command.associationId); if (target === undefined) return rejected("TARGET_NOT_FOUND"); const ids = command.ends.map((item) => item.id); const original = new Set(target.ends.map((item) => item.id)); if (hasDuplicateIds(ids) || ids.some((item) => !original.has(item) && allIds.has(item))) return rejected("DUPLICATE_ID"); if (associationNameExists(model, command.name, target.id)) return rejected("DUPLICATE_NAME"); const value: UmlAssociation = { kind: "association", id: target.id, ...(command.name === undefined ? {} : { name: command.name }), ends: clone(command.ends) }; if (!associationCompatible(model, value)) return rejected("INCOMPATIBLE_REFERENCE"); return accepted(candidate(current, { ...model, associations: replace(model.associations, target.id, value) }));
    }
    case "DeleteAssociation": { const target = model.associations.find((item) => item.id === command.associationId); if (target === undefined) return rejected("TARGET_NOT_FOUND"); if (hasLayoutReference(current, target.id)) return rejected("DEPENDENCIES_EXIST"); return accepted(candidate(current, { ...model, associations: without(model.associations, target.id) })); }
    case "CreateGeneralization": { const value = { kind: "generalization" as const, ...clone(command.value) }; if (!idAvailable(value.id)) return rejected("DUPLICATE_ID"); if (!classifierIds(model).has(value.specificId) || !classifierIds(model).has(value.generalId)) return rejected("INCOMPATIBLE_REFERENCE"); if (model.generalizations.some((item) => item.specificId === value.specificId && item.generalId === value.generalId)) return rejected("DUPLICATE_ID"); return accepted(candidate(current, { ...model, generalizations: [...model.generalizations, value] })); }
    case "DeleteGeneralization": { const target = model.generalizations.find((item) => item.id === command.generalizationId); if (target === undefined) return rejected("TARGET_NOT_FOUND"); if (hasLayoutReference(current, target.id)) return rejected("DEPENDENCIES_EXIST"); return accepted(candidate(current, { ...model, generalizations: without(model.generalizations, target.id) })); }
    case "MoveNode": { const target = current.layout.nodes.find((item) => item.elementId === command.elementId); if (target === undefined) return rejected("TARGET_NOT_FOUND"); return accepted(candidate(current, model, { nodes: current.layout.nodes.map((item) => item.elementId === target.elementId ? { ...item, x: command.x, y: command.y } : item) })); }
    case "UpdateGenerationProfile": { const profile = { classes: clone(command.classes), attributes: clone(command.attributes), defaultSort: clone(command.defaultSort) }; if (!profileCompatible(model, profile)) return rejected("INCOMPATIBLE_REFERENCE"); return accepted(candidate(current, model, current.layout, profile)); }
  }
};
