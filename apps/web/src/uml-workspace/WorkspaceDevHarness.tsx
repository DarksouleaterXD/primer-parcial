import { useRef } from "preact/hooks";

import { WorkspaceView } from "./WorkspaceView";
import type { WorkspaceController } from "./workspace-controller";
import {
  createRelationsFixtureDocument,
  createWorkspaceSessionFromDocument,
} from "./workspace-fixture";

export function WorkspaceDevHarness() {
  const sessionRef = useRef<WorkspaceController | null>(null);
  if (sessionRef.current === null) {
    sessionRef.current = createWorkspaceSessionFromDocument(createRelationsFixtureDocument());
  }
  if (!import.meta.env.DEV) {
    return (
      <p class="private-status" data-testid="workspace-dev-unavailable">
        El harness de fixture solo está disponible en modo desarrollo.
      </p>
    );
  }
  return <WorkspaceView controller={sessionRef.current} />;
}