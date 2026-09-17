import {
  UmlCommandBus,
  isUmlCommand,
  multiplicity,
  primitiveType,
  type UmlCommand,
  type UmlCommandKind,
  type UmlCommandPreconditionCode,
  type UmlCommandResult,
} from "../src/index.js";
import * as publicDomain from "../src/index.js";
import { describe, expect, it } from "vitest";
import { createValidProjectDocumentFixture, ids } from "./fixtures/project-document.fixture.js";

const id = (suffix: string): string => `00000000-0000-4000-8000-000000000${suffix}`;

const kinds = [
  "CreatePackage", "RenamePackage", "DeletePackage", "CreateClass", "RenameClass", "DeleteClass",
  "AddAttribute", "UpdateAttribute", "RemoveAttribute", "AddOperation", "UpdateOperation", "RemoveOperation",
  "AddParameter", "UpdateParameter", "RemoveParameter", "CreateEnumeration", "RenameEnumeration", "DeleteEnumeration",
  "AddEnumerationLiteral", "RemoveEnumerationLiteral", "CreateAssociation", "UpdateAssociation", "DeleteAssociation",
  "CreateGeneralization", "DeleteGeneralization", "MoveNode", "UpdateGenerationProfile",
] as const satisfies readonly UmlCommandKind[];

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends <Value>() =>
  Value extends Right ? 1 : 2
  ? true
  : false;
type Expect<Condition extends true> = Condition;
type UmlCommandKindIsExhaustive = Expect<Equal<UmlCommand["kind"], (typeof kinds)[number]>>;

const command: UmlCommand = {
  kind: "AddAttribute",
  classId: id("001"),
  value: {
    kind: "attribute", id: id("002"), name: "email", visibility: "private",
    type: primitiveType("string"), multiplicity: multiplicity(1, 1),
  },
};

describe("UmlCommand public contracts", () => {
  it("declares the exact exhaustive 27-kind catalogue", () => {
    const exhaustive: UmlCommandKindIsExhaustive = true;

    expect(exhaustive).toBe(true);
    expect(kinds).toHaveLength(27);
    expect(new Set(kinds)).toHaveLength(27);
  });

  it("accepts only complete nested Create/Add values and closed update shapes", () => {
    expect(isUmlCommand(command)).toBe(true);
    expect(isUmlCommand({
      kind: "UpdateAssociation", associationId: id("003"), ends: [
        { kind: "association-end", id: id("004"), classifierId: id("005"), multiplicity: multiplicity(0, "*"), aggregation: "none" },
        { kind: "association-end", id: id("006"), classifierId: id("007"), multiplicity: multiplicity(1, 1), aggregation: "shared" },
      ],
    })).toBe(true);
    expect(isUmlCommand({ kind: "UpdateGenerationProfile", classes: [], attributes: [], defaultSort: [] })).toBe(true);
  });

  it.each([
    ["missing nested value", { kind: "AddAttribute", classId: id("001") }],
    ["flat value", { kind: "AddAttribute", classId: id("001"), id: id("002"), name: "email" }],
    ["partial value", { kind: "AddAttribute", classId: id("001"), value: { kind: "attribute", id: id("002") } }],
    ["unknown spread field", { ...command, unexpected: true }],
    ["map", new Map([["kind", "RenameClass"]])],
    ["generic path patch", { kind: "UpdateAttribute", path: "name", value: "email" }],
    ["field value patch", { kind: "RenameClass", classId: id("001"), field: "name", value: "User" }],
    ["callback", { kind: "RenameClass", classId: id("001"), name: () => "User" }],
    ["unknown command", { kind: "PatchAnything" }],
  ])("rejects %s before execution", (_label, malformed) => {
    expect(isUmlCommand(malformed)).toBe(false);
  });

  it("keeps public error codes and result discriminants closed", () => {
    const codes: readonly UmlCommandPreconditionCode[] = [
      "TARGET_NOT_FOUND", "PARENT_NOT_FOUND", "PARENT_MISMATCH", "DUPLICATE_ID",
      "DUPLICATE_NAME", "DEPENDENCIES_EXIST", "INCOMPATIBLE_REFERENCE",
    ];
    const rejected: UmlCommandResult = { kind: "rejected", error: { kind: "precondition-failed", code: codes[0]! } };
    const unsupported: UmlCommandResult = { kind: "rejected", error: { kind: "unsupported-command" } };

    expect(codes).toHaveLength(7);
    expect(rejected.error.kind).toBe("precondition-failed");
    expect(unsupported.error.kind).toBe("unsupported-command");
  });

  it("lets a package consumer use only the public command boundary", () => {
    const bus = new UmlCommandBus(createValidProjectDocumentFixture());

    expect(bus.submit({
      kind: "RenameClass",
      classId: ids.adminClass,
      name: "Administrator",
    })).toMatchObject({ kind: "accepted" });
    expect(typeof publicDomain.UmlCommandBus).toBe("function");
    expect(publicDomain).not.toHaveProperty("executeUmlCommand");
  });
});
