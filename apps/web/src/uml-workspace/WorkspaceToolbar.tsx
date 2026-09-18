import { useWorkspace } from "./WorkspaceContext";

export function WorkspaceToolbar() {
  const { controller, requestUpdate } = useWorkspace();
  const { canUndo, canRedo } = controller.state;

  const undo = (): void => {
    controller.undo();
    requestUpdate();
  };

  const redo = (): void => {
    controller.redo();
    requestUpdate();
  };

  return (
    <header class="uml-workspace__toolbar">
      <p class="uml-workspace__label">Modelo UML</p>
      <span class="uml-workspace__toolbar-spacer" />
      <button type="button" disabled={!canUndo} title="Deshacer" onClick={undo}>
        Undo
      </button>
      <button type="button" disabled={!canRedo} title="Rehacer" onClick={redo}>
        Redo
      </button>
    </header>
  );
}
