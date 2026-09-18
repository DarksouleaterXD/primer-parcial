import {
  UmlCommandBus,
  parseProjectDocument,
  serializeProjectDocument,
  validateProjectDocument,
} from "../src/index.js";
import { describe, expect, it } from "vitest";

import {
  createValidProjectDocumentFixture,
  ids,
} from "./fixtures/project-document.fixture.js";

describe("CU-3 persistence boundary regression", () => {
  it("preserves the complete canonical ProjectDocument through the durable round-trip boundary", () => {
    const original = createValidProjectDocumentFixture();
    const serialized = serializeProjectDocument(original);
    const parsed = parseProjectDocument(serialized);

    expect(parsed).toEqual(original);
    expect(parsed.uml).toEqual(original.uml);
    expect(parsed.layout).toEqual(original.layout);
    expect(parsed.generationProfile).toEqual(original.generationProfile);
    expect(parsed.id).toBe(original.id);
    expect(parsed.ownerId).toBe(original.ownerId);
    expect(parsed.revision).toBe(original.revision);
    expect(parsed.createdAt).toBe(original.createdAt);
    expect(parsed.updatedAt).toBe(original.updatedAt);
    expect(validateProjectDocument(parsed, "save").diagnostics).toEqual([]);
  });

  it("keeps the 27-command bus and Undo/Redo local and serializable without a persistence dependency", () => {
    const initial = createValidProjectDocumentFixture();
    const bus = new UmlCommandBus(initial);
    const accepted = bus.submit({
      kind: "RenameClass",
      classId: ids.adminClass,
      name: "Administrator",
    });

    expect(accepted.kind).toBe("accepted");
    if (accepted.kind !== "accepted") {
      throw new Error("Expected RenameClass to be accepted.");
    }

    expect(parseProjectDocument(serializeProjectDocument(accepted.document))).toEqual(
      accepted.document,
    );
    expect(bus.undo()).toEqual({
      kind: "restored",
      operation: "undo",
      document: initial,
    });
    expect(bus.redo()).toEqual({
      kind: "restored",
      operation: "redo",
      document: accepted.document,
    });
  });
});
