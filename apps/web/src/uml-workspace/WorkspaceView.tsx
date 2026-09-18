import { useState } from "preact/hooks";

import type { WorkspaceController } from "./workspace-controller";
import { WorkspaceContext } from "./WorkspaceContext";
import { WorkspaceToolbar } from "./WorkspaceToolbar";
import { WorkspaceToolbox } from "./WorkspaceToolbox";
import { WorkspaceCanvas } from "./WorkspaceCanvas";
import { WorkspaceInspector } from "./WorkspaceInspector";
import { WorkspaceFeedback } from "./WorkspaceFeedback";

interface WorkspaceViewProps {
  readonly controller: WorkspaceController;
}

export function WorkspaceView({ controller }: WorkspaceViewProps) {
  const [, setTick] = useState(0);
  const requestUpdate = () => setTick((tick) => tick + 1);

  const state = controller.state;

  return (
    <WorkspaceContext.Provider value={{ controller, requestUpdate }}>
      <section class="uml-workspace">
        <WorkspaceToolbar />
        <div class="uml-workspace__body">
          <WorkspaceToolbox />
          <WorkspaceCanvas
            document={state.currentDocument}
            selectedElementId={state.selectedElementId}
          />
          <WorkspaceInspector />
        </div>
        <WorkspaceFeedback />
      </section>
    </WorkspaceContext.Provider>
  );
}