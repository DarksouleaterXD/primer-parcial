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

type MutableRecord = Record<string, unknown>;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const asRecord = (value: unknown): MutableRecord => value as MutableRecord;
const asArray = (value: unknown): unknown[] => value as unknown[];

const firstAttribute = (input: MutableRecord): MutableRecord => {
  const uml = asRecord(input.uml);
  const firstClass = asRecord(asArray(uml.classes)[0]);
  return asRecord(asArray(firstClass.attributes)[0]);
};

const firstAssociationEnd = (input: MutableRecord): MutableRecord => {
  const uml = asRecord(input.uml);
  const association = asRecord(asArray(uml.associations)[0]);
  return asRecord(asArray(association.ends)[0]);
};

const expectStructureRejection = (
  mutate: (input: MutableRecord) => void,
): void => {
  const input = clone(createValidProjectDocumentFixture()) as unknown as MutableRecord;
  mutate(input);

  try {
    parseProjectDocument(JSON.stringify(input));
    throw new Error("Expected parser to reject malformed document");
  } catch (caught) {
    expect(caught).toBeInstanceOf(ProjectDocumentParseError);
    expect((caught as ProjectDocumentParseError).code).toBe(
      "DOCUMENT_STRUCTURE_INVALID",
    );
  }
};

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
    const input = clone(createValidProjectDocumentFixture()) as unknown as MutableRecord;
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
    expect(() => parseProjectDocument("{")).toThrow(ProjectDocumentParseError);

    const malformed = clone(createValidProjectDocumentFixture()) as unknown as MutableRecord;
    const uml = asRecord(malformed.uml);
    uml.classes = "not-an-array";

    expect(() => parseProjectDocument(JSON.stringify(malformed))).toThrow(
      ProjectDocumentParseError,
    );
  });

  it.each([
    [
      "invalid UUID",
      (input: MutableRecord) => {
        input.id = "not-a-uuid";
      },
    ],
    [
      "invalid ISO timestamp",
      (input: MutableRecord) => {
        input.createdAt = "2026-09-15";
      },
    ],
    [
      "invalid element discriminator",
      (input: MutableRecord) => {
        const uml = asRecord(input.uml);
        const firstClass = asRecord(asArray(uml.classes)[0]);
        firstClass.kind = "klass";
      },
    ],
    [
      "invalid visibility",
      (input: MutableRecord) => {
        firstAttribute(input).visibility = "internal";
      },
    ],
    [
      "invalid primitive type",
      (input: MutableRecord) => {
        asRecord(firstAttribute(input).type).name = "money";
      },
    ],
    [
      "invalid aggregation",
      (input: MutableRecord) => {
        firstAssociationEnd(input).aggregation = "whole";
      },
    ],
    [
      "invalid layout coordinate",
      (input: MutableRecord) => {
        const layout = asRecord(input.layout);
        const firstNode = asRecord(asArray(layout.nodes)[0]);
        firstNode.x = "left";
      },
    ],
    [
      "invalid generation profile direction",
      (input: MutableRecord) => {
        const profile = asRecord(input.generationProfile);
        const defaultSort = asRecord(asArray(profile.defaultSort)[0]);
        defaultSort.direction = "up";
      },
    ],
    [
      "unknown property in a closed contract",
      (input: MutableRecord) => {
        firstAttribute(input).databaseColumn = "email_address";
      },
    ],
    [
      "association without exactly two ends",
      (input: MutableRecord) => {
        const uml = asRecord(input.uml);
        const association = asRecord(asArray(uml.associations)[0]);
        association.ends = [asArray(association.ends)[0]];
      },
    ],
  ] as Array<[string, (input: MutableRecord) => void]>)(
    "rejects %s before returning a ProjectDocument",
    (label, mutate) => {
      expect(label.length).toBeGreaterThan(0);
      expectStructureRejection(mutate);
    },
  );

  it("rejects semantically invalid references after structural validation", () => {
    const input = clone(createValidProjectDocumentFixture()) as unknown as MutableRecord;
    asRecord(firstAttribute(input).type).kind = "classifier";
    const type = asRecord(firstAttribute(input).type);
    delete type.name;
    type.classifierId = "00000000-0000-4000-8000-000000000099";

    expect(() => parseProjectDocument(JSON.stringify(input))).toThrow(
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
