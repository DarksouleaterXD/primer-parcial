import { useRef } from "preact/hooks";

import {
  createWorkspaceSession,
  type WorkspaceController,
  type WorkspaceIdFactory,
} from "./workspace-controller";
import { WorkspaceView } from "./WorkspaceView";

interface UmlWorkspaceProps {
  readonly ownerId: string;
  readonly idFactory?: WorkspaceIdFactory;
}

export function UmlWorkspace({ ownerId, idFactory }: UmlWorkspaceProps) {
  const controllerRef = useRef<WorkspaceController | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = createWorkspaceSession({ ownerId, idFactory });
  }
  return <WorkspaceView controller={controllerRef.current} />;
}