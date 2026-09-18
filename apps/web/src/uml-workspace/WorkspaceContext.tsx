import { createContext } from "preact";
import { useContext } from "preact/hooks";

import type { WorkspaceController } from "./workspace-controller";

export interface WorkspaceContextValue {
  readonly controller: WorkspaceController;
  readonly requestUpdate: () => void;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const useWorkspace = (): WorkspaceContextValue => {
  const value = useContext(WorkspaceContext);
  if (value === null) {
    throw new Error("useWorkspace must be used inside WorkspaceContext.Provider");
  }
  return value;
};