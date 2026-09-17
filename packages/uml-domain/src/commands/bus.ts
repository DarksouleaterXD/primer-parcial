import type { ProjectDocument } from "../document/types.js";
import { validateProjectDocument } from "../validation/validator.js";
import type { ValidationDiagnostic } from "../validation/types.js";
import { executeUmlCommand } from "./executor.js";
import { isUmlCommand } from "./runtime-validation.js";
import type { UmlCommandResult, UmlHistoryResult } from "./types.js";

const clone = <Value>(value: Value): Value =>
  JSON.parse(JSON.stringify(value)) as Value;

const unsupported = (): UmlCommandResult => ({
  kind: "rejected",
  error: { kind: "unsupported-command" },
});

const validationFailure = (
  diagnostics: readonly ValidationDiagnostic[],
): UmlCommandResult => ({
  kind: "rejected",
  error: { kind: "validation-failed", diagnostics },
});

const unexpectedFailure = (): UmlCommandResult =>
  validationFailure([
    {
      severity: "error",
      code: "VALIDATION_INTERNAL_ERROR",
      message: "Command execution failed internally.",
      path: "$",
    },
  ]);

/** The sole public stateful boundary for local UML document mutations. */
export class UmlCommandBus {
  static readonly #historyCapacity = 100;

  #currentDocument: ProjectDocument;
  #undoStack: readonly ProjectDocument[] = [];
  #redoStack: readonly ProjectDocument[] = [];

  public constructor(initialDocument: ProjectDocument) {
    this.#currentDocument = clone(initialDocument);
  }

  public get currentDocument(): ProjectDocument {
    return clone(this.#currentDocument);
  }

  public get canUndo(): boolean {
    return this.#undoStack.length > 0;
  }

  public get canRedo(): boolean {
    return this.#redoStack.length > 0;
  }

  #boundedPush(stack: readonly ProjectDocument[], snapshot: ProjectDocument): readonly ProjectDocument[] {
    const next = [...stack, snapshot];
    return next.length > UmlCommandBus.#historyCapacity ? next.slice(1) : next;
  }

  #commit(
    currentDocument: ProjectDocument,
    undoStack: readonly ProjectDocument[],
    redoStack: readonly ProjectDocument[],
  ): void {
    this.#currentDocument = currentDocument;
    this.#undoStack = undoStack;
    this.#redoStack = redoStack;
  }

  public submit(input: unknown): UmlCommandResult {
    if (!isUmlCommand(input)) {
      return unsupported();
    }

    try {
      const execution = executeUmlCommand(this.#currentDocument, input);
      if (execution.kind === "rejected") {
        return execution;
      }

      const validation = validateProjectDocument(execution.document, "edit");
      if (validation.blocked) {
        return validationFailure(validation.diagnostics);
      }

      const next: ProjectDocument = {
        ...execution.document,
        revision: this.#currentDocument.revision + 1,
        createdAt: this.#currentDocument.createdAt,
        updatedAt: this.#currentDocument.updatedAt,
      };

      this.#commit(
        next,
        this.#boundedPush(this.#undoStack, this.#currentDocument),
        [],
      );
      return { kind: "accepted", document: clone(next) };
    } catch {
      return unexpectedFailure();
    }
  }

  public undo(): UmlHistoryResult {
    const previous = this.#undoStack.at(-1);
    if (previous === undefined) {
      return { kind: "unavailable", operation: "undo" };
    }

    this.#commit(
      previous,
      this.#undoStack.slice(0, -1),
      this.#boundedPush(this.#redoStack, this.#currentDocument),
    );
    return { kind: "restored", operation: "undo", document: clone(previous) };
  }

  public redo(): UmlHistoryResult {
    const next = this.#redoStack.at(-1);
    if (next === undefined) {
      return { kind: "unavailable", operation: "redo" };
    }

    this.#commit(
      next,
      this.#boundedPush(this.#undoStack, this.#currentDocument),
      this.#redoStack.slice(0, -1),
    );
    return { kind: "restored", operation: "redo", document: clone(next) };
  }
}
