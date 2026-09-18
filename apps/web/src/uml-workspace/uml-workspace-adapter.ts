import type {
  ProjectDocument,
  UmlCommand,
  UmlCommandResult,
  UmlHistoryResult,
} from "@primer-parcial/uml-domain";
import { UmlCommandBus } from "@primer-parcial/uml-domain";

export interface UmlWorkspaceAdapter {
  readonly currentDocument: ProjectDocument;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  submit(command: UmlCommand): UmlCommandResult;
  undo(): UmlHistoryResult;
  redo(): UmlHistoryResult;
}

export const createUmlWorkspaceAdapter = (
  bus: UmlCommandBus,
): UmlWorkspaceAdapter => ({
  get currentDocument() {
    return bus.currentDocument;
  },
  get canUndo() {
    return bus.canUndo;
  },
  get canRedo() {
    return bus.canRedo;
  },
  submit(command) {
    return bus.submit(command);
  },
  undo() {
    return bus.undo();
  },
  redo() {
    return bus.redo();
  },
});
