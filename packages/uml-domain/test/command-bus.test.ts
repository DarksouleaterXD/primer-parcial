import { describe, expect, it, vi } from "vitest";

import {
  UmlCommandBus,
  multiplicity,
  parseProjectDocument,
  serializeProjectDocument,
  type ProjectDocument,
  type UmlHistoryResult,
} from "../src/index.js";
import { createValidProjectDocumentFixture, ids } from "./fixtures/project-document.fixture.js";

describe("UmlCommandBus", () => {
  it("uses the edit policy exactly once for a complete candidate and commits only revision", async () => {
    const validator = await import("../src/validation/validator.js");
    const validate = vi.spyOn(validator, "validateProjectDocument");
    const initial = createValidProjectDocumentFixture();
    const bus = new UmlCommandBus(initial);

    const result = bus.submit({
      kind: "AddAttribute",
      classId: ids.adminClass,
      value: {
        id: "00000000-0000-4000-8000-000000000101",
        name: "email",
        visibility: "private",
        type: { kind: "primitive", name: "string" },
        multiplicity: multiplicity(1, 1),
      },
    });

    expect(result.kind).toBe("accepted");
    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledWith(expect.any(Object), "edit");
    expect(bus.currentDocument.revision).toBe(initial.revision + 1);
    expect(bus.currentDocument.createdAt).toBe(initial.createdAt);
    expect(bus.currentDocument.updatedAt).toBe(initial.updatedAt);
    expect(bus.currentDocument.uml.classes.find((item) => item.id === ids.adminClass)?.attributes).toHaveLength(1);
    validate.mockRestore();
  });

  it("rejects malformed inputs and preconditions before validation without changing the current document", async () => {
    const validator = await import("../src/validation/validator.js");
    const validate = vi.spyOn(validator, "validateProjectDocument");
    const bus = new UmlCommandBus(createValidProjectDocumentFixture());
    const before = bus.currentDocument;

    expect(bus.submit({ kind: "CreateClass" })).toEqual({
      kind: "rejected",
      error: { kind: "unsupported-command" },
    });
    expect(bus.submit({ kind: "RenameClass", classId: "missing", name: "Other" })).toEqual({
      kind: "rejected",
      error: { kind: "precondition-failed", code: "TARGET_NOT_FOUND" },
    });
    expect(validate).not.toHaveBeenCalled();
    expect(bus.currentDocument).toEqual(before);
    validate.mockRestore();
  });

  it("keeps the current document unchanged when edit validation blocks", async () => {
    const validator = await import("../src/validation/validator.js");
    const validate = vi.spyOn(validator, "validateProjectDocument");
    validate.mockReturnValue({
      policy: "edit",
      diagnostics: [{
        severity: "error",
        code: "VALIDATION_INTERNAL_ERROR",
        message: "Forced validation failure.",
        path: "$",
      }],
      hasErrors: true,
      blocked: true,
    });
    const bus = new UmlCommandBus(createValidProjectDocumentFixture());
    const before = bus.currentDocument;

    const result = bus.submit({
      kind: "RenameClass",
      classId: ids.adminClass,
      name: "Administrator",
    });

    expect(result).toEqual({
      kind: "rejected",
      error: {
        kind: "validation-failed",
        diagnostics: expect.any(Array),
      },
    });
    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledWith(expect.any(Object), "edit");
    expect(bus.currentDocument).toEqual(before);
    validate.mockRestore();
  });

  it("keeps the current document unchanged when candidate construction fails", async () => {
    const executor = await import("../src/commands/executor.js");
    const execute = vi.spyOn(executor, "executeUmlCommand").mockImplementationOnce(() => {
      throw new Error("forced candidate construction failure");
    });
    const bus = new UmlCommandBus(createValidProjectDocumentFixture());
    const before = bus.currentDocument;

    expect(bus.submit({
      kind: "RenameClass",
      classId: ids.adminClass,
      name: "Administrator",
    })).toEqual({
      kind: "rejected",
      error: {
        kind: "validation-failed",
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ code: "VALIDATION_INTERNAL_ERROR" }),
        ]),
      },
    });
    expect(bus.currentDocument).toEqual(before);
    execute.mockRestore();
  });

  it("is deterministic and does not expose mutable current document state", () => {
    const first = new UmlCommandBus(createValidProjectDocumentFixture());
    const second = new UmlCommandBus(createValidProjectDocumentFixture());
    const command = {
      kind: "RenameClass" as const,
      classId: ids.adminClass,
      name: "Administrator",
    };

    expect(first.submit(command)).toEqual(second.submit(command));
    const observed = first.currentDocument;
    observed.uml.classes[0]!.name = "external mutation";
    expect(first.currentDocument.uml.classes[0]!.name).toBe("User");
    const observedAgain = first.currentDocument;
    observedAgain.uml.classes.find((item) => item.id === ids.adminClass)!.name = "external state mutation";
    expect(first.currentDocument.uml.classes.find((item) => item.id === ids.adminClass)?.name).toBe("Administrator");
  });

  it("exposes only the closed history surface", () => {
    const bus = new UmlCommandBus(createValidProjectDocumentFixture());

    expect(bus).not.toHaveProperty("state");
    expect(bus).toHaveProperty("currentDocument");
    expect(bus).toHaveProperty("canUndo", false);
    expect(bus).toHaveProperty("canRedo", false);
    expect(bus).toHaveProperty("undo");
    expect(bus).toHaveProperty("redo");
    expect(bus).not.toHaveProperty("current");
    expect(bus).not.toHaveProperty("history");
    expect(bus).not.toHaveProperty("capacity");
  });

  it("returns exact unavailable results without changing the tuple", () => {
    const bus = new UmlCommandBus(createValidProjectDocumentFixture());
    const before = bus.currentDocument;

    const undo: UmlHistoryResult = bus.undo();
    const redo: UmlHistoryResult = bus.redo();

    expect(undo).toEqual({ kind: "unavailable", operation: "undo" });
    expect(redo).toEqual({ kind: "unavailable", operation: "redo" });
    expect(bus.currentDocument).toEqual(before);
    expect(bus.canUndo).toBe(false);
    expect(bus.canRedo).toBe(false);
  });

  it("restores complete model, layout, profile, timestamps, and revisions exactly", () => {
    const initial = createValidProjectDocumentFixture();
    const bus = new UmlCommandBus(initial);
    const first = bus.submit({
      kind: "AddAttribute",
      classId: ids.adminClass,
      value: {
        id: "00000000-0000-4000-8000-000000000101", name: "email",
        visibility: "private", type: { kind: "primitive", name: "string" }, multiplicity: multiplicity(1, 1),
      },
    });
    expect(first.kind).toBe("accepted");
    const afterAttribute = bus.currentDocument;
    expect(bus.submit({ kind: "MoveNode", elementId: ids.adminClass, x: 700, y: 800 }).kind).toBe("accepted");
    const afterLayout = bus.currentDocument;
    expect(bus.submit({
      kind: "UpdateGenerationProfile", classes: [{ classId: ids.adminClass, readOnly: true }], attributes: [], defaultSort: [],
    }).kind).toBe("accepted");
    const afterProfile = bus.currentDocument;

    expect(bus.undo()).toEqual({ kind: "restored", operation: "undo", document: afterLayout });
    expect(bus.currentDocument).toEqual(afterLayout);
    expect(bus.undo()).toEqual({ kind: "restored", operation: "undo", document: afterAttribute });
    expect(bus.currentDocument).toEqual(afterAttribute);
    expect(bus.undo()).toEqual({ kind: "restored", operation: "undo", document: initial });
    expect(bus.currentDocument).toEqual(initial);
    expect(bus.redo()).toEqual({ kind: "restored", operation: "redo", document: afterAttribute });
    expect(bus.redo()).toEqual({ kind: "restored", operation: "redo", document: afterLayout });
    expect(bus.redo()).toEqual({ kind: "restored", operation: "redo", document: afterProfile });
  });

  it("materializes layout through MoveNode and restores the exact entry through history", async () => {
    const validator = await import("../src/validation/validator.js");
    const validate = vi.spyOn(validator, "validateProjectDocument");
    const initial = createValidProjectDocumentFixture();
    initial.layout.nodes = initial.layout.nodes.filter((node) => node.elementId !== ids.adminClass);
    const bus = new UmlCommandBus(initial);

    const moved = bus.submit({ kind: "MoveNode", elementId: ids.adminClass, x: 700, y: 800 });
    const afterMove = bus.currentDocument;

    expect(moved.kind).toBe("accepted");
    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledWith(expect.any(Object), "edit");
    expect(afterMove.layout.nodes).toEqual([...initial.layout.nodes, { elementId: ids.adminClass, x: 700, y: 800 }]);
    expect(afterMove.revision).toBe(initial.revision + 1);
    expect(afterMove.createdAt).toBe(initial.createdAt);
    expect(afterMove.updatedAt).toBe(initial.updatedAt);

    expect(bus.undo()).toEqual({ kind: "restored", operation: "undo", document: initial });
    expect(bus.currentDocument.revision).toBe(initial.revision);
    expect(bus.redo()).toEqual({ kind: "restored", operation: "redo", document: afterMove });
    expect(bus.currentDocument).toEqual(afterMove);
    validate.mockRestore();
  });

  it("preserves redo after rejection and clears it only after an accepted branch", () => {
    const bus = new UmlCommandBus(createValidProjectDocumentFixture());
    expect(bus.submit({ kind: "RenameClass", classId: ids.adminClass, name: "Administrator" }).kind).toBe("accepted");
    expect(bus.submit({ kind: "RenameClass", classId: ids.adminClass, name: "Account" }).kind).toBe("accepted");
    expect(bus.undo().kind).toBe("restored");
    const beforeRejectedBranch = bus.currentDocument;

    expect(bus.submit({ kind: "RenameClass", classId: "missing", name: "Other" })).toEqual({
      kind: "rejected", error: { kind: "precondition-failed", code: "TARGET_NOT_FOUND" },
    });
    expect(bus.currentDocument).toEqual(beforeRejectedBranch);
    expect(bus.canUndo).toBe(true);
    expect(bus.canRedo).toBe(true);
    expect(bus.submit({ kind: "RenameClass", classId: ids.adminClass, name: "Member" }).kind).toBe("accepted");
    expect(bus.canRedo).toBe(false);
    expect(bus.redo()).toEqual({ kind: "unavailable", operation: "redo" });
  });

  it("preserves the complete history tuple for every rejected submit path", async () => {
    const prepareBranch = (): { bus: UmlCommandBus; redoDocument: ProjectDocument } => {
      const bus = new UmlCommandBus(createValidProjectDocumentFixture());
      bus.submit({ kind: "RenameClass", classId: ids.adminClass, name: "Administrator" });
      const accepted = bus.submit({ kind: "RenameClass", classId: ids.adminClass, name: "Account" });
      expect(accepted.kind).toBe("accepted");
      const redoDocument = accepted.kind === "accepted" ? accepted.document : bus.currentDocument;
      bus.undo();
      return { bus, redoDocument };
    };
    const assertPreserved = (bus: UmlCommandBus, before: ProjectDocument, redoDocument: ProjectDocument): void => {
      expect(bus.currentDocument).toEqual(before);
      expect(bus.canUndo).toBe(true);
      expect(bus.canRedo).toBe(true);
      expect(bus.redo()).toEqual({ kind: "restored", operation: "redo", document: redoDocument });
    };

    for (const command of [
      { kind: "CreateClass", value: { id: "missing-context", name: "Other" } },
      { kind: "RenameClass", classId: "missing", name: "Other" },
      null,
      "CreateClass",
      1,
      true,
      [],
      new Map([["kind", "CreateClass"]]),
    ]) {
      const { bus, redoDocument } = prepareBranch();
      const before = bus.currentDocument;
      expect(bus.submit(command).kind).toBe("rejected");
      assertPreserved(bus, before, redoDocument);
    }

    const validationBranch = prepareBranch();
    const validationBefore = validationBranch.bus.currentDocument;
    const validator = await import("../src/validation/validator.js");
    const validation = vi.spyOn(validator, "validateProjectDocument").mockReturnValue({
      policy: "edit", diagnostics: [{ severity: "error", code: "VALIDATION_INTERNAL_ERROR", message: "Forced validation failure.", path: "$" }], hasErrors: true, blocked: true,
    });
    expect(validationBranch.bus.submit({ kind: "RenameClass", classId: ids.adminClass, name: "Member" }).kind).toBe("rejected");
    assertPreserved(validationBranch.bus, validationBefore, validationBranch.redoDocument);
    validation.mockRestore();

    const executor = await import("../src/commands/executor.js");
    const execution = vi.spyOn(executor, "executeUmlCommand");
    const executionBranch = prepareBranch();
    const executionBefore = executionBranch.bus.currentDocument;
    execution.mockImplementationOnce(() => { throw new Error("forced candidate construction failure"); });
    expect(executionBranch.bus.submit({ kind: "RenameClass", classId: ids.adminClass, name: "Member" }).kind).toBe("rejected");
    assertPreserved(executionBranch.bus, executionBefore, executionBranch.redoDocument);
    execution.mockRestore();
  });

  it("does not invoke the executor or validator during navigation", async () => {
    const executor = await import("../src/commands/executor.js");
    const validator = await import("../src/validation/validator.js");
    const execute = vi.spyOn(executor, "executeUmlCommand");
    const validate = vi.spyOn(validator, "validateProjectDocument");
    const bus = new UmlCommandBus(createValidProjectDocumentFixture());
    bus.submit({ kind: "RenameClass", classId: ids.adminClass, name: "Administrator" });
    execute.mockClear();
    validate.mockClear();

    bus.undo();
    bus.redo();

    expect(execute).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    execute.mockRestore();
    validate.mockRestore();
  });

  it("retains exactly the newest 100 accepted snapshots", () => {
    const bus = new UmlCommandBus(createValidProjectDocumentFixture());
    for (let index = 1; index <= 101; index += 1) {
      expect(bus.submit({ kind: "RenameClass", classId: ids.adminClass, name: `User ${index}` }).kind).toBe("accepted");
    }

    for (let index = 0; index < 100; index += 1) {
      expect(bus.undo().kind).toBe("restored");
    }

    const oldestRecoverable: ProjectDocument = bus.currentDocument;
    expect(oldestRecoverable.revision).toBe(4);
    expect(bus.undo()).toEqual({ kind: "unavailable", operation: "undo" });
    expect(bus.canUndo).toBe(false);
    expect(bus.canRedo).toBe(true);
  });

  it("returns accepted documents that remain serializable and parseable", () => {
    const bus = new UmlCommandBus(createValidProjectDocumentFixture());
    const result = bus.submit({
      kind: "RenameClass",
      classId: ids.adminClass,
      name: "Administrator",
    });

    expect(result.kind).toBe("accepted");
    if (result.kind === "accepted") {
      expect(parseProjectDocument(serializeProjectDocument(result.document))).toEqual(
        result.document,
      );
    }
  });
});
