import {
  validateProjectDocument,
  type ProjectDocument,
} from "../src/index.js";
import { describe, expect, it } from "vitest";

import {
  createValidProjectDocumentFixture,
  ids,
} from "./fixtures/project-document.fixture.js";

const codes = (document: ProjectDocument) =>
  validateProjectDocument(document, "save").diagnostics.map((item) => item.code);

describe("UML domain validation", () => {
  it("accepts the complete supported UML fixture", () => {
    const result = validateProjectDocument(
      createValidProjectDocumentFixture(),
      "save",
    );

    expect(result).toEqual({
      policy: "save",
      diagnostics: [],
      hasErrors: false,
      blocked: false,
    });
  });

  it("detects duplicate IDs with a deterministic path", () => {
    const document = createValidProjectDocumentFixture();
    document.uml.classes[1]!.id = ids.userClass;

    const duplicate = validateProjectDocument(document, "save").diagnostics.find(
      (item) => item.code === "UML_ID_DUPLICATE",
    );

    expect(duplicate?.path).toBe("uml.classes[1].id");
  });

  it("requires trimmed names for packages, classifiers and members", () => {
    const document = createValidProjectDocumentFixture();
    document.uml.packages[0]!.name = "   ";
    document.uml.classes[0]!.attributes[0]!.name = "";
    document.uml.classes[0]!.operations[0]!.name = "  ";
    document.uml.enumerations[0]!.name = "";

    expect(
      codes(document).filter((code) => code === "UML_NAME_REQUIRED"),
    ).toHaveLength(4);
  });

  it("validates classifier references and multiplicities", () => {
    const document = createValidProjectDocumentFixture();
    document.uml.classes[0]!.attributes[1]!.type = {
      kind: "classifier",
      classifierId: "missing-classifier",
    };
    document.uml.classes[0]!.attributes[0]!.multiplicity = {
      lower: 5,
      upper: 2,
    };

    expect(codes(document)).toEqual(
      expect.arrayContaining([
        "UML_REFERENCE_MISSING",
        "UML_MULTIPLICITY_INVALID",
      ]),
    );
  });

  it.each([
    { lower: 1, upper: 1 as const },
    { lower: 0, upper: 1 as const },
    { lower: 1, upper: "*" as const },
    { lower: 0, upper: "*" as const },
  ])("accepts multiplicity $lower..$upper", (value) => {
    const document = createValidProjectDocumentFixture();
    document.uml.classes[0]!.attributes[0]!.multiplicity = value;

    expect(codes(document)).not.toContain("UML_MULTIPLICITY_INVALID");
  });

  it("detects package cycles", () => {
    const document = createValidProjectDocumentFixture();
    document.uml.packages.push({
      kind: "package",
      id: "00000000-0000-4000-8000-000000000020",
      name: "Nested",
      parentPackageId: ids.packageDomain,
    });
    document.uml.packages[0]!.parentPackageId =
      "00000000-0000-4000-8000-000000000020";

    expect(codes(document)).toContain("UML_PACKAGE_CYCLE");
  });

  it("detects self and cyclic generalization", () => {
    const document = createValidProjectDocumentFixture();
    document.uml.generalizations.push({
      kind: "generalization",
      id: "00000000-0000-4000-8000-000000000021",
      specificId: ids.userClass,
      generalId: ids.adminClass,
    });

    expect(codes(document)).toContain("UML_GENERALIZATION_CYCLE");
  });

  it("validates association references and supported composite ownership", () => {
    const document = createValidProjectDocumentFixture();
    document.uml.associations[0]!.ends[0].aggregation = "composite";
    document.uml.associations[0]!.ends[1].aggregation = "composite";
    document.uml.associations[0]!.ends[1].classifierId = "missing-classifier";

    expect(codes(document)).toEqual(
      expect.arrayContaining(["UML_ASSOCIATION_INVALID", "UML_REFERENCE_MISSING"]),
    );
  });

  it("detects orphan layout and profile references", () => {
    const document = createValidProjectDocumentFixture();
    document.layout.nodes.push({ elementId: "missing-layout", x: 0, y: 0 });
    document.generationProfile.classes.push({ classId: "missing-class" });
    document.generationProfile.attributes.push({
      attributeId: "missing-attribute",
    });

    expect(codes(document)).toEqual(
      expect.arrayContaining([
        "LAYOUT_REFERENCE_MISSING",
        "PROFILE_REFERENCE_MISSING",
      ]),
    );
  });

  it("rejects default sort attributes owned by another class", () => {
    const document = createValidProjectDocumentFixture();
    document.generationProfile.defaultSort[0]!.classId = ids.adminClass;

    expect(codes(document)).toContain("PROFILE_REFERENCE_INCOMPATIBLE");
  });

  it("returns diagnostics in stable path/code order", () => {
    const document = createValidProjectDocumentFixture();
    document.uml.classes[0]!.attributes[0]!.name = "";
    document.layout.nodes.push({ elementId: "missing-layout", x: 0, y: 0 });

    const diagnostics = validateProjectDocument(document, "save").diagnostics;
    const sorted = [...diagnostics].sort((left, right) =>
      left.path.localeCompare(right.path) || left.code.localeCompare(right.code),
    );

    expect(diagnostics).toEqual(sorted);
  });

  it("emits a warning for duplicate classifier names in the same package", () => {
    const document = createValidProjectDocumentFixture();
    document.uml.classes[1]!.name = " user ";

    const result = validateProjectDocument(document, "save");

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          code: "UML_NAME_DUPLICATE",
        }),
      ]),
    );
    expect(result.hasErrors).toBe(false);
    expect(result.blocked).toBe(false);
  });

  it("uses the same diagnostics across policies while edit tolerates intermediate errors", () => {
    const document = createValidProjectDocumentFixture();
    document.uml.classes[0]!.attributes[0]!.multiplicity = {
      lower: 5,
      upper: 2,
    };

    const edit = validateProjectDocument(document, "edit");
    const save = validateProjectDocument(document, "save");
    const imported = validateProjectDocument(document, "import");
    const generated = validateProjectDocument(document, "generate");

    expect(edit.diagnostics).toEqual(save.diagnostics);
    expect(imported.diagnostics).toEqual(save.diagnostics);
    expect(generated.diagnostics).toEqual(save.diagnostics);
    expect(edit.blocked).toBe(false);
    expect(save.blocked).toBe(true);
    expect(imported.blocked).toBe(true);
    expect(generated.blocked).toBe(true);
  });
});
