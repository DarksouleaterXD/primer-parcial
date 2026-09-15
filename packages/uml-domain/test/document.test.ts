import {
  ProjectDocumentParseError,
  createProjectDocument,
  parseProjectDocument,
  serializeProjectDocument,
  validateProjectDocument,
} from "../src/index.js";
import { describe, expect, it } from "vitest";

import {
  createValidProjectDocumentFixture,
  ids,
} from "./fixtures/project-document.fixture.js";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe("ProjectDocument", () => {
  it("creates a deterministic empty versioned document through injected factories", () => {
    const document = createProjectDocument({
      name: "  Modelo  ",
      ownerId: `  ${ids.owner}  `,
      idFactory: () => ids.document,
      clock: () => new Date("2026-09-14T10:00:00.000Z"),
    });

    expect(document).toEqual({
      schemaVersion: 1,
      id: ids.document,
      name: "Modelo",
      ownerId: ids.owner,
      revision: 0,
      createdAt: "2026-09-14T10:00:00.000Z",
      updatedAt: "2026-09-14T10:00:00.000Z",
      uml: {
        packages: [],
        classes: [],
        enumerations: [],
        associations: [],
        generalizations: [],
      },
      layout: { nodes: [] },
      generationProfile: { classes: [], attributes: [], defaultSort: [] },
    });
  });

  it("rejects empty document names and owners", () => {
    expect(() =>
      createProjectDocument({ name: "   ", ownerId: ids.owner }),
    ).toThrow("name is required");
    expect(() =>
      createProjectDocument({ name: "Modelo", ownerId: "   " }),
    ).toThrow("ownerId is required");
  });

  it("round-trips UML, layout, profile and metadata", () => {
    const original = createValidProjectDocumentFixture();
    const serialized = serializeProjectDocument(original);
    const parsed = parseProjectDocument(serialized);

    expect(parsed).toEqual(original);
    expect(validateProjectDocument(parsed, "save").diagnostics).toEqual([]);
  });

  it("serializes object keys deterministically without mutating array order", () => {
    const document = createValidProjectDocumentFixture();
    const first = serializeProjectDocument(document);
    const second = serializeProjectDocument(parseProjectDocument(first));

    expect(second).toBe(first);
    expect(document.uml.classes.map((item) => item.id)).toEqual([
      ids.userClass,
      ids.adminClass,
    ]);
  });

  it("rejects unsupported schema versions with a typed error", () => {
    const input = clone(createValidProjectDocumentFixture()) as unknown as Record<
      string,
      unknown
    >;
    input.schemaVersion = 99;

    try {
      parseProjectDocument(JSON.stringify(input));
      throw new Error("Expected parser to reject unsupported version");
    } catch (caught) {
      expect(caught).toBeInstanceOf(ProjectDocumentParseError);
      expect((caught as ProjectDocumentParseError).code).toBe(
        "DOCUMENT_VERSION_UNSUPPORTED",
      );
    }
  });

  it("rejects malformed JSON and malformed top-level collections without partial documents", () => {
    expect(() => parseProjectDocument("{"))
      .toThrow(ProjectDocumentParseError);

    const malformed = clone(createValidProjectDocumentFixture()) as unknown as Record<
      string,
      unknown
    >;
    const uml = malformed.uml as Record<string, unknown>;
    uml.classes = "not-an-array";

    expect(() => parseProjectDocument(JSON.stringify(malformed))).toThrow(
      ProjectDocumentParseError,
    );
  });

  it("keeps layout and generation profile outside UML semantics", () => {
    const document = createValidProjectDocumentFixture();
    const umlBefore = clone(document.uml);

    document.layout.nodes[1]!.x = 999;
    document.generationProfile.classes[0]!.readOnly = true;

    expect(document.uml).toEqual(umlBefore);
  });
});
