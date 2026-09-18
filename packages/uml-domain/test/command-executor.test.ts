import { describe, expect, it } from "vitest";

import { executeUmlCommand } from "../src/commands/executor.js";
import { multiplicity, primitiveType, type ProjectDocument, type UmlCommand } from "../src/index.js";
import { createValidProjectDocumentFixture, ids } from "./fixtures/project-document.fixture.js";

const id = (suffix: string): string => `00000000-0000-4000-8000-000000000${suffix}`;
const clone = <Value>(value: Value): Value => JSON.parse(JSON.stringify(value)) as Value;
const emptyDocument = (): ProjectDocument => ({
  ...createValidProjectDocumentFixture(),
  uml: { packages: [], classes: [], enumerations: [], associations: [], generalizations: [] },
  layout: { nodes: [] },
  generationProfile: { classes: [], attributes: [], defaultSort: [] },
});
const accepted = (document: ProjectDocument, command: UmlCommand): ProjectDocument => {
  const result = executeUmlCommand(document, command);
  expect(result.kind).toBe("accepted");
  return result.kind === "accepted" ? result.document : document;
};
const rejectedCode = (document: ProjectDocument, command: unknown, code: string): void => {
  expect(executeUmlCommand(document, command)).toEqual({
    kind: "rejected", error: { kind: "precondition-failed", code },
  });
};

describe("private UML command executor", () => {
  it("executes each of the 27 closed commands without changing revision or timestamps", () => {
    let document = emptyDocument();
    const commands: readonly UmlCommand[] = [
      { kind: "CreatePackage", parentPackageId: null, value: { id: id("020"), name: "Domain" } },
      { kind: "RenamePackage", packageId: id("020"), name: "Core" },
      { kind: "CreateClass", packageId: id("020"), value: { id: id("021"), name: "User" } },
      { kind: "RenameClass", classId: id("021"), name: "Account" },
      { kind: "AddAttribute", classId: id("021"), value: { id: id("022"), name: "email", visibility: "private", type: primitiveType("string"), multiplicity: multiplicity(1, 1) } },
      { kind: "UpdateAttribute", classId: id("021"), attributeId: id("022"), name: "address", visibility: "public", type: primitiveType("string"), multiplicity: multiplicity(0, 1) },
      { kind: "AddOperation", classId: id("021"), value: { id: id("023"), name: "rename", visibility: "public", parameters: [] } },
      { kind: "UpdateOperation", classId: id("021"), operationId: id("023"), name: "changeName", visibility: "private", parameters: [], returnType: primitiveType("boolean") },
      { kind: "AddParameter", classId: id("021"), operationId: id("023"), value: { id: id("024"), name: "name", type: primitiveType("string"), multiplicity: multiplicity(1, 1) } },
      { kind: "UpdateParameter", classId: id("021"), operationId: id("023"), parameterId: id("024"), name: "newName", type: primitiveType("string"), multiplicity: multiplicity(0, 1) },
      { kind: "CreateEnumeration", packageId: id("020"), value: { id: id("025"), name: "Role" } },
      { kind: "RenameEnumeration", enumerationId: id("025"), name: "Kind" },
      { kind: "AddEnumerationLiteral", enumerationId: id("025"), value: { id: id("026"), name: "PRIMARY" } },
      { kind: "CreateAssociation", value: { id: id("027"), name: "accountKind", ends: [
        { id: id("028"), classifierId: id("021"), multiplicity: multiplicity(1, 1), aggregation: "none" },
        { id: id("029"), classifierId: id("025"), multiplicity: multiplicity(0, "*"), aggregation: "none" },
      ] } },
      { kind: "UpdateAssociation", associationId: id("027"), ends: [
        { kind: "association-end", id: id("028"), classifierId: id("021"), multiplicity: multiplicity(0, "*"), aggregation: "shared" },
        { kind: "association-end", id: id("029"), classifierId: id("025"), multiplicity: multiplicity(1, 1), aggregation: "none" },
      ] },
      { kind: "CreateGeneralization", value: { id: id("030"), specificId: id("021"), generalId: id("025") } },
      { kind: "MoveNode", elementId: id("021"), x: 100, y: 200 },
      { kind: "UpdateGenerationProfile", classes: [{ classId: id("021"), entity: true }], attributes: [{ attributeId: id("022"), required: true }], defaultSort: [{ classId: id("021"), attributeId: id("022"), direction: "asc" }] },
      { kind: "DeleteGeneralization", generalizationId: id("030") },
      { kind: "DeleteAssociation", associationId: id("027") },
      { kind: "RemoveEnumerationLiteral", enumerationId: id("025"), literalId: id("026") },
      { kind: "DeleteEnumeration", enumerationId: id("025") },
      { kind: "RemoveParameter", classId: id("021"), operationId: id("023"), parameterId: id("024") },
      { kind: "RemoveOperation", classId: id("021"), operationId: id("023") },
      { kind: "RemoveAttribute", classId: id("021"), attributeId: id("022") },
      { kind: "DeleteClass", classId: id("021") },
      { kind: "DeletePackage", packageId: id("020") },
    ];

    for (const command of commands) {
      // Layout/profile commands are independently successful; retaining their data
      // would deliberately block the later reject-only removal commands.
      const input = command.kind === "MoveNode"
        ? { ...document, layout: { nodes: [{ elementId: id("021"), x: 0, y: 0 }] } }
        : document;
      const result = accepted(input, command);
      if (command.kind !== "MoveNode" && command.kind !== "UpdateGenerationProfile") {
        document = result;
      }
      expect(document.revision).toBe(3);
      expect(document.createdAt).toBe("2026-09-14T12:00:00.000Z");
      expect(document.updatedAt).toBe("2026-09-14T12:30:00.000Z");
    }
  });

  it("rejects malformed runtime envelopes before constructing a candidate", () => {
    const document = emptyDocument();
    for (const command of [
      { kind: "CreateClass" },
      { kind: "CreateClass", id: id("031"), name: "Flat" },
      { kind: "AddAttribute", classId: id("031"), value: { kind: "attribute", id: id("032") } },
      { kind: "CreatePackage", value: { kind: "package", id: id("033"), name: "P" }, unknown: true },
      new Map([["kind", "CreatePackage"]]),
      { kind: "UpdateAttribute", path: "name", value: "x" },
      { kind: "RenameClass", classId: id("031"), field: "name", value: "x" },
      { kind: "RenameClass", classId: id("031"), name: () => "x" },
    ]) {
      expect(executeUmlCommand(document, command)).toEqual({ kind: "rejected", error: { kind: "unsupported-command" } });
    }
  });

  it("uses exact precondition codes for ownership, duplicates, compatibility, and rejects without mutating inputs", () => {
    const document = createValidProjectDocumentFixture();
    const before = clone(document);
    rejectedCode(document, { kind: "AddAttribute", classId: id("099"), value: { id: id("040"), name: "x", visibility: "public", type: primitiveType("string"), multiplicity: multiplicity(1, 1) } }, "PARENT_NOT_FOUND");
    rejectedCode(document, { kind: "RemoveAttribute", classId: ids.adminClass, attributeId: ids.emailAttribute }, "PARENT_MISMATCH");
    rejectedCode(document, { kind: "RenameClass", classId: id("099"), name: "x" }, "TARGET_NOT_FOUND");
    rejectedCode(document, { kind: "CreatePackage", parentPackageId: null, value: { id: ids.userClass, name: "Other" } }, "DUPLICATE_ID");
    rejectedCode(document, { kind: "CreateClass", packageId: ids.packageDomain, value: { id: id("041"), name: " role " } }, "DUPLICATE_NAME");
    rejectedCode(document, { kind: "CreateAssociation", value: { id: id("042"), ends: [
      { id: id("043"), classifierId: ids.userClass, multiplicity: multiplicity(1, 1), aggregation: "none" },
      { id: id("044"), classifierId: id("099"), multiplicity: multiplicity(1, 1), aggregation: "none" },
    ] } }, "INCOMPATIBLE_REFERENCE");
    expect(document).toEqual(before);
  });

  it("enforces only the declared duplicate-name namespaces and ownership chains", () => {
    const document = createValidProjectDocumentFixture();
    const collisions: readonly UmlCommand[] = [
      { kind: "CreatePackage", parentPackageId: null, value: { id: id("045"), name: " domain " } },
      { kind: "AddAttribute", classId: ids.userClass, value: { id: id("046"), name: "EMAIL", visibility: "public", type: primitiveType("string"), multiplicity: multiplicity(1, 1) } },
      { kind: "AddOperation", classId: ids.userClass, value: { id: id("047"), name: "RENAME", visibility: "public", parameters: [] } },
      { kind: "AddParameter", classId: ids.userClass, operationId: ids.renameOperation, value: { id: id("048"), name: "NAME", type: primitiveType("string"), multiplicity: multiplicity(1, 1) } },
      { kind: "AddEnumerationLiteral", enumerationId: ids.roleEnum, value: { id: id("049"), name: "admin" } },
      { kind: "CreateAssociation", value: { id: id("050"), name: " USERROLE ", ends: [
        { id: id("051"), classifierId: ids.userClass, multiplicity: multiplicity(1, 1), aggregation: "none" },
        { id: id("052"), classifierId: ids.roleEnum, multiplicity: multiplicity(1, 1), aggregation: "none" },
      ] } },
    ];
    for (const command of collisions) rejectedCode(document, command, "DUPLICATE_NAME");
    rejectedCode(document, { kind: "UpdateOperation", classId: ids.adminClass, operationId: ids.renameOperation, name: "x", visibility: "public", parameters: [] }, "PARENT_MISMATCH");
    rejectedCode(document, { kind: "UpdateParameter", classId: ids.userClass, operationId: id("099"), parameterId: ids.renameParameter, name: "x", type: primitiveType("string"), multiplicity: multiplicity(1, 1) }, "TARGET_NOT_FOUND");
    const independent = accepted(document, { kind: "CreateAssociation", value: { id: id("053"), ends: [
        { id: id("054"), classifierId: ids.userClass, multiplicity: multiplicity(1, 1), aggregation: "none" },
        { id: id("055"), classifierId: ids.roleEnum, multiplicity: multiplicity(1, 1), aggregation: "none" },
    ] } });
    expect(independent.uml.associations).toHaveLength(2);
  });

  it("enforces every reject-only deletion dependency without a cascade", () => {
    const document = createValidProjectDocumentFixture();
    const cases: readonly UmlCommand[] = [
      { kind: "DeletePackage", packageId: ids.packageDomain },
      { kind: "DeleteClass", classId: ids.userClass },
      { kind: "DeleteEnumeration", enumerationId: ids.roleEnum },
      { kind: "RemoveOperation", classId: ids.userClass, operationId: ids.renameOperation },
      { kind: "RemoveAttribute", classId: ids.userClass, attributeId: ids.emailAttribute },
      { kind: "RemoveParameter", classId: ids.userClass, operationId: ids.renameOperation, parameterId: ids.renameParameter },
      { kind: "RemoveEnumerationLiteral", enumerationId: ids.roleEnum, literalId: ids.roleLiteralAdmin },
    ];
    for (const command of cases) {
      const dependent = clone(document);
      if (command.kind === "RemoveParameter") {
        dependent.layout.nodes.push({ elementId: ids.renameParameter, x: 0, y: 0 });
      }
      if (command.kind === "RemoveEnumerationLiteral") {
        dependent.generationProfile.attributes.push({ attributeId: ids.roleLiteralAdmin });
      }
      rejectedCode(dependent, command, "DEPENDENCIES_EXIST");
    }
    const withAssociationLayout = clone(document);
    withAssociationLayout.layout.nodes.push({ elementId: ids.association, x: 0, y: 0 });
    rejectedCode(withAssociationLayout, { kind: "DeleteAssociation", associationId: ids.association }, "DEPENDENCIES_EXIST");
    const withGeneralizationLayout = clone(document);
    withGeneralizationLayout.layout.nodes.push({ elementId: ids.generalization, x: 0, y: 0 });
    rejectedCode(withGeneralizationLayout, { kind: "DeleteGeneralization", generalizationId: ids.generalization }, "DEPENDENCIES_EXIST");
    expect(document).toEqual(createValidProjectDocumentFixture());
  });

  it("replaces complete update/layout/profile values and is deterministic and immutable", () => {
    const document = createValidProjectDocumentFixture();
    const command: UmlCommand = { kind: "UpdateAssociation", associationId: ids.association, name: "renamed", ends: [
      { kind: "association-end", id: ids.associationUserEnd, classifierId: ids.adminClass, multiplicity: multiplicity(0, 1), aggregation: "none" },
      { kind: "association-end", id: ids.associationRoleEnd, classifierId: ids.roleEnum, multiplicity: multiplicity(1, "*"), aggregation: "composite" },
    ] };
    const first = executeUmlCommand(document, command);
    const second = executeUmlCommand(document, command);
    expect(first).toEqual(second);
    expect(first.kind).toBe("accepted");
    expect(first.kind === "accepted" && first.document).not.toBe(document);
    if (first.kind === "accepted") {
      first.document.uml.associations[0]!.name = "changed-only-in-output";
    }
    expect(document.uml.associations[0]!.name).toBe("userRole");
    const moved = accepted(document, { kind: "MoveNode", elementId: ids.userClass, x: 999, y: 777 });
    expect(moved.uml).toEqual(document.uml);
    expect(moved.generationProfile).toEqual(document.generationProfile);
    rejectedCode(document, { kind: "MoveNode", elementId: id("098"), x: 0, y: 0 }, "TARGET_NOT_FOUND");
    const profile = accepted(document, { kind: "UpdateGenerationProfile", classes: [{ classId: ids.adminClass, readOnly: true }], attributes: [], defaultSort: [] });
    expect(profile.uml).toEqual(document.uml);
    expect(profile.layout).toEqual(document.layout);
    expect(profile.generationProfile).toEqual({ classes: [{ classId: ids.adminClass, readOnly: true }], attributes: [], defaultSort: [] });
  });

  it("moves existing diagrammable layout nodes without changing other document data", () => {
    const document = createValidProjectDocumentFixture();
    const moved = accepted(document, { kind: "MoveNode", elementId: ids.userClass, x: 999, y: 777 });

    expect(moved.layout.nodes).toEqual([
      { elementId: ids.packageDomain, x: 40, y: 40 },
      { elementId: ids.userClass, x: 999, y: 777 },
      { elementId: ids.adminClass, x: 420, y: 90 },
      { elementId: ids.roleEnum, x: 120, y: 360 },
    ]);
    expect(moved.uml).toEqual(document.uml);
    expect(moved.generationProfile).toEqual(document.generationProfile);
  });

  it.each([ids.packageDomain, ids.adminClass, ids.roleEnum])(
    "materializes layout for a diagrammable target without an existing node",
    (elementId) => {
      const document = createValidProjectDocumentFixture();
      document.layout.nodes = document.layout.nodes.filter((node) => node.elementId !== elementId);

      const moved = accepted(document, { kind: "MoveNode", elementId, x: 999, y: 777 });

      expect(moved.layout.nodes).toEqual([...document.layout.nodes, { elementId, x: 999, y: 777 }]);
      expect(moved.uml).toEqual(document.uml);
      expect(moved.generationProfile).toEqual(document.generationProfile);
    },
  );

  it.each([
    id("098"),
    ids.emailAttribute,
    ids.renameOperation,
    ids.renameParameter,
    ids.roleLiteralAdmin,
    ids.association,
    ids.generalization,
  ])("rejects non-diagrammable MoveNode target %s without materializing layout", (elementId) => {
    const document = createValidProjectDocumentFixture();
    const before = clone(document);

    rejectedCode(document, { kind: "MoveNode", elementId, x: 999, y: 777 }, "TARGET_NOT_FOUND");
    expect(document).toEqual(before);
  });
});
