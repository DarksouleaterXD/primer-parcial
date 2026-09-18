import { cleanup, fireEvent, render, screen, within } from "@testing-library/preact";
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "preact/hooks";

import { UmlWorkspace } from "../src/uml-workspace/UmlWorkspace";
import { WorkspaceContext } from "../src/uml-workspace/WorkspaceContext";
import { WorkspaceToolbar } from "../src/uml-workspace/WorkspaceToolbar";
import { WorkspaceToolbox } from "../src/uml-workspace/WorkspaceToolbox";
import { WorkspaceCanvas } from "../src/uml-workspace/WorkspaceCanvas";
import { WorkspaceInspector } from "../src/uml-workspace/WorkspaceInspector";
import { WorkspaceFeedback } from "../src/uml-workspace/WorkspaceFeedback";
import type { WorkspaceController } from "../src/uml-workspace/workspace-controller";
import { ownerId, buildRichController } from "./workspace-helpers";

const documentId = () => "00000000-0000-4000-8000-000000000001";

afterEach(() => {
  cleanup();
});

interface WorkspaceHarnessProps {
  readonly controller: WorkspaceController;
}

function WorkspaceHarness({ controller }: WorkspaceHarnessProps) {
  const [, setTick] = useState(0);
  const requestUpdate = () => setTick((tick) => tick + 1);

  return (
    <WorkspaceContext.Provider value={{ controller, requestUpdate }}>
      <WorkspaceToolbar />
      <WorkspaceToolbox />
      <WorkspaceCanvas
        document={controller.state.currentDocument}
        selectedElementId={controller.state.selectedElementId}
      />
      <WorkspaceInspector />
      <WorkspaceFeedback />
    </WorkspaceContext.Provider>
  );
}

describe("Workspace shell (Block 3)", () => {
  it("renders toolbar, toolbox, canvas, inspector, and history visible with static label", () => {
    render(<UmlWorkspace ownerId={ownerId} idFactory={documentId} />);

    expect(screen.getByText("Modelo UML")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Crear paquete" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Crear clase/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Crear enumeración/ })).toBeTruthy();
    expect(screen.getByTestId("workspace-canvas-empty")).toBeTruthy();
    expect(screen.getByText("Sin selección")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Redo" })).toBeTruthy();
  });

  it("starts with history controls disabled on a fresh bus", () => {
    render(<UmlWorkspace ownerId={ownerId} idFactory={documentId} />);

    expect((screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Redo" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows an empty state without implicit nodes when the document has no diagrammable elements", () => {
    render(<UmlWorkspace ownerId={ownerId} idFactory={documentId} />);

    expect(screen.getByText("No hay elementos en el modelo aún.")).toBeTruthy();
    expect(document.querySelectorAll(".uml-workspace__node").length).toBe(0);
    expect(screen.getByLabelText("Nombre del nuevo elemento")).toBeTruthy();
  });

  it("keeps the three shell regions in layout order so the desktop grid maps them to columns 1-2-3", () => {
    render(<UmlWorkspace ownerId={ownerId} idFactory={documentId} />);

    const body = document.querySelector(".uml-workspace__body")!;
    const regions = Array.from(body.children).map((child) =>
      child.classList.contains("uml-workspace__toolbox")
        ? "toolbox"
        : child.classList.contains("uml-workspace__canvas")
          ? "canvas"
          : child.classList.contains("uml-workspace__inspector")
            ? "inspector"
            : "other",
    );
    expect(regions).toEqual(["toolbox", "canvas", "inspector"]);
  });
});

describe("Workspace rendering (Block 3.2)", () => {
  const nodeTransform = (text: string | RegExp): string | null =>
    screen.getByText(text).closest("g")?.getAttribute("transform") ?? null;

  it("renders a Class with name, read-only attributes, read-only operations, and fallback position", () => {
    const { controller } = buildRichController();
    render(<WorkspaceHarness controller={controller} />);

    expect(nodeTransform("User")).toBe("translate(320, 80)");
    expect(screen.getByText("email")).toBeTruthy();
    expect(screen.getByText("signIn()")).toBeTruthy();
    expect(screen.getByText("User").closest("g")!.querySelectorAll("input").length).toBe(0);
    expect(controller.state.currentDocument.revision).toBeGreaterThan(0);
  });

  it("renders an Enumeration with name and read-only literals at its fallback position", () => {
    const { controller } = buildRichController();
    render(<WorkspaceHarness controller={controller} />);

    expect(nodeTransform(/«enumeration» Role/)).toBe("translate(80, 260)");
    expect(screen.getByText("ADMIN")).toBeTruthy();
    expect(screen.getByText("USER")).toBeTruthy();
    expect(
      screen.getByText(/«enumeration» Role/).closest("g")!.querySelectorAll("input").length,
    ).toBe(0);
  });

  it("uses a confirmed layout entry over the fallback when MoveNode accepted", () => {
    const { controller, ids } = buildRichController();
    controller.submit({ kind: "MoveNode", elementId: ids.classId, x: 120, y: 90 });

    render(<WorkspaceHarness controller={controller} />);

    expect(nodeTransform("User")).toBe("translate(120, 90)");
    expect(controller.state.currentDocument.layout.nodes).toContainEqual({
      elementId: ids.classId,
      x: 120,
      y: 90,
    });
  });

  it("renders only projectable relations and omits relations with missing endpoints", () => {
    const { controller } = buildRichController();
    render(<WorkspaceHarness controller={controller} />);

    expect(screen.getByText("owns")).toBeTruthy();
    expect(document.querySelectorAll(".uml-workspace__relation").length).toBe(2);
    expect(document.querySelectorAll(".uml-workspace__relation-path").length).toBe(2);
  });
});

describe("Workspace node selection (Block 3)", () => {
  it("clicking a Class selects it and the Inspector shows its read-only details", () => {
    const { controller, ids } = buildRichController();
    render(<WorkspaceHarness controller={controller} />);

    fireEvent.click(screen.getByText("User").closest("g")!);

    expect(controller.state.selectedElementId).toBe(ids.classId);
    const inspector = screen.getByLabelText("Inspector");
    expect(within(inspector).getByText("Clase")).toBeTruthy();
    expect(within(inspector).getByText(ids.classId)).toBeTruthy();
    expect(within(inspector).getByTestId("inspector-attributes").textContent).toContain(
      "email",
    );
    expect(within(inspector).getByTestId("inspector-operations").textContent).toContain(
      "signIn()",
    );
    expect(
      within(within(inspector).getByTestId("inspector-attributes")).queryByRole("textbox"),
    ).toBeNull();
  });

  it("clicking an Enumeration selects it and the Inspector shows its read-only literals", () => {
    const { controller, ids } = buildRichController();
    render(<WorkspaceHarness controller={controller} />);

    fireEvent.click(screen.getByText(/«enumeration» Role/).closest("g")!);

    expect(controller.state.selectedElementId).toBe(ids.enumId);
    const inspector = screen.getByLabelText("Inspector");
    expect(within(inspector).getByText("Enumeración")).toBeTruthy();
    expect(within(inspector).getByText(ids.enumId)).toBeTruthy();
    expect(within(inspector).getByText("ADMIN")).toBeTruthy();
    expect(within(inspector).getByText("USER")).toBeTruthy();
    expect(
      within(within(inspector).getByTestId("inspector-literals")).queryByRole("textbox"),
    ).toBeNull();
  });

  it("reflects the selected node with a visual class and aria-selected", () => {
    const { controller } = buildRichController();
    render(<WorkspaceHarness controller={controller} />);

    fireEvent.click(screen.getByText("User").closest("g")!);

    const node = within(screen.getByTestId("workspace-canvas"))
      .getByText("User")
      .closest("g")!;
    expect(node.classList.contains("uml-workspace__node--selected")).toBe(true);
    expect(node.getAttribute("aria-selected")).toBe("true");
    expect(controller.state.selectedElementId).not.toBeNull();
  });

  it("clicking the background clears the selection and restores the neutral Inspector", () => {
    const { controller } = buildRichController();
    render(<WorkspaceHarness controller={controller} />);

    fireEvent.click(screen.getByText("User").closest("g")!);
    expect(controller.state.selectedElementId).not.toBeNull();

    fireEvent.click(screen.getByTestId("canvas-background"));

    expect(controller.state.selectedElementId).toBeNull();
    expect(screen.getByTestId("inspector-empty")).toBeTruthy();
    expect(screen.getByText("Sin selección")).toBeTruthy();
  });

  it("keeps the Inspector neutral and read-only with a populated document and no selection", () => {
    const { controller } = buildRichController();
    render(<WorkspaceHarness controller={controller} />);

    expect(screen.getByTestId("inspector-empty")).toBeTruthy();
    expect(screen.getByText("Sin selección")).toBeTruthy();
    expect(
      within(screen.getByLabelText("Inspector")).queryByRole("textbox"),
    ).toBeNull();
    expect(document.querySelectorAll(".uml-workspace__node").length).toBeGreaterThan(0);
  });
});

describe("Workspace no-mutation guarantee", () => {
  it("rendering and selecting never change revision, layout, model, or history", () => {
    const { controller } = buildRichController();
    const before = JSON.stringify(controller.state.currentDocument);
    const revisionBefore = controller.state.currentDocument.revision;
    const canUndoBefore = controller.state.canUndo;
    const canRedoBefore = controller.state.canRedo;
    const layoutBefore = JSON.stringify(controller.state.currentDocument.layout);

    render(<WorkspaceHarness controller={controller} />);
    fireEvent.click(screen.getByText("User").closest("g")!);
    fireEvent.click(screen.getByText(/«enumeration» Role/).closest("g")!);
    fireEvent.click(screen.getByTestId("canvas-background"));

    expect(JSON.stringify(controller.state.currentDocument)).toBe(before);
    expect(controller.state.currentDocument.revision).toBe(revisionBefore);
    expect(JSON.stringify(controller.state.currentDocument.layout)).toBe(layoutBefore);
    expect(controller.state.canUndo).toBe(canUndoBefore);
    expect(controller.state.canRedo).toBe(canRedoBefore);
  });
});