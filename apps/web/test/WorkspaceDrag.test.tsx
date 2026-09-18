import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "preact/hooks";

import {
  createProjectDocument,
  UmlCommandBus,
} from "@primer-parcial/uml-domain";

import { WorkspaceToolbar } from "../src/uml-workspace/WorkspaceToolbar";
import { WorkspaceToolbox } from "../src/uml-workspace/WorkspaceToolbox";
import { WorkspaceCanvas } from "../src/uml-workspace/WorkspaceCanvas";
import { WorkspaceInspector } from "../src/uml-workspace/WorkspaceInspector";
import { WorkspaceFeedback } from "../src/uml-workspace/WorkspaceFeedback";
import { WorkspaceContext } from "../src/uml-workspace/WorkspaceContext";
import {
  createWorkspaceController,
  type WorkspaceController,
} from "../src/uml-workspace/workspace-controller";
import {
  ownerId,
  buildRecordingSession,
  buildRichController,
  buildStubAdapter,
  deterministicIds,
} from "./workspace-helpers";

afterEach(() => {
  cleanup();
});

const uuid = (value: number): string =>
  `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const PKG_ID = uuid(1);
const CLS_ID = uuid(2);

function Harness({ controller }: { readonly controller: WorkspaceController }) {
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

const userNode = (): SVGGElement =>
  screen.getByText("User").closest("g") as SVGGElement;

const packageNode = (): SVGGElement =>
  screen.getByText("«package» Domain").closest("g") as SVGGElement;

const ev = { pointerId: 1 };

const bindCanvasGeometry = (): void => {
  const svg = screen.getByTestId("workspace-canvas") as SVGSVGElement;
  const [x, y, width, height] = svg
    .getAttribute("viewBox")!
    .split(/\s+/)
    .map(Number);
  svg.getBoundingClientRect = () => ({
    x,
    y,
    left: x,
    top: y,
    width,
    height,
    right: x + width,
    bottom: y + height,
    toJSON: (): { x: number; y: number; width: number; height: number; top: number; right: number; bottom: number; left: number } => ({
      x,
      y,
      width,
      height,
      top: y,
      right: x + width,
      bottom: y + height,
      left: x,
    }),
  });
};

const seedPackageAndClass = (): void => {
  fireEvent.input(screen.getByLabelText("Nombre del nuevo elemento"), {
    target: { value: "Domain" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Crear paquete" }));
  fireEvent.click(packageNode());
  fireEvent.input(screen.getByLabelText("Nombre del nuevo elemento"), {
    target: { value: "User" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Crear clase/ }));
};

describe("Workspace pointer drag (Block 5.1)", () => {
  it("previews the move without mutating document, layout, revision, or history, then commits one MoveNode", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([PKG_ID, CLS_ID]),
    );
    render(<Harness controller={controller} />);
    seedPackageAndClass();
    bindCanvasGeometry();

    const revisionBefore = controller.state.currentDocument.revision;
    const documentBefore = JSON.stringify(controller.state.currentDocument);
    const layoutBefore = JSON.stringify(controller.state.currentDocument.layout);
    const canUndoBefore = controller.state.canUndo;
    const canRedoBefore = controller.state.canRedo;

    fireEvent.pointerDown(userNode(), { ...ev, clientX: 320, clientY: 80 });
    fireEvent.pointerMove(window, { ...ev, clientX: 350, clientY: 80 });

    expect(userNode().getAttribute("transform")).toBe("translate(350, 80)");
    expect(controller.state.dragPreview).toEqual({
      elementId: CLS_ID,
      position: { x: 350, y: 80 },
    });
    expect(JSON.stringify(controller.state.currentDocument)).toBe(documentBefore);
    expect(JSON.stringify(controller.state.currentDocument.layout)).toBe(layoutBefore);
    expect(controller.state.currentDocument.revision).toBe(revisionBefore);
    expect(controller.state.canUndo).toBe(canUndoBefore);
    expect(controller.state.canRedo).toBe(canRedoBefore);
    expect(commands).toHaveLength(2);

    fireEvent.pointerUp(window, { ...ev, clientX: 350, clientY: 80 });

    expect(commands).toHaveLength(3);
    expect(commands[2]).toEqual({
      kind: "MoveNode",
      elementId: CLS_ID,
      x: 350,
      y: 80,
    });
    expect(controller.state.dragPreview).toBeNull();
    expect(controller.resolvePosition(CLS_ID)).toEqual({ x: 350, y: 80 });
    expect(controller.state.currentDocument.layout.nodes).toContainEqual({
      elementId: CLS_ID,
      x: 350,
      y: 80,
    });
    expect(controller.state.currentDocument.revision).toBe(revisionBefore + 1);
    expect(userNode().getAttribute("transform")).toBe("translate(350, 80)");
  });

  it("moves relations with the preview and reverts them on cancel", () => {
    const { controller } = buildRichController();
    render(<Harness controller={controller} />);
    bindCanvasGeometry();

    const relationLongitude = (): Array<{ x1: number; x2: number; y1: number; y2: number }> =>
      Array.from(
        document.querySelectorAll<SVGPathElement>(".uml-workspace__relation-path"),
      ).map((path) => {
        const numbers = (path.getAttribute("d") ?? "")
          .split(/[\s,]+/)
          .map(Number)
          .filter((value) => Number.isFinite(value));
        return {
          x1: numbers[0],
          y1: numbers[1],
          x2: numbers[numbers.length - 2] ?? 0,
          y2: numbers[numbers.length - 1] ?? 0,
        };
      });
    const before = relationLongitude();
    expect(before.length).toBe(2);

    fireEvent.pointerDown(userNode(), { ...ev, clientX: 320, clientY: 80 });
    fireEvent.pointerMove(window, { ...ev, clientX: 340, clientY: 80 });

    const during = relationLongitude();
    during.forEach((line, index) => {
      const beforeLine = before[index];
      const xDeltas = [line.x1 - beforeLine.x1, line.x2 - beforeLine.x2].sort(
        (a, b) => a - b,
      );
      expect(xDeltas).toEqual([0, 20]);
      expect(line.y1).toBe(beforeLine.y1);
      expect(line.y2).toBe(beforeLine.y2);
    });

    fireEvent.pointerCancel(window, { ...ev, clientX: 340, clientY: 80 });

    expect(relationLongitude()).toEqual(before);
    expect(userNode().getAttribute("transform")).toBe("translate(320, 80)");
    expect(controller.state.dragPreview).toBeNull();
  });

  it("treats press and release without movement as a no-op", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([PKG_ID, CLS_ID]),
    );
    render(<Harness controller={controller} />);
    seedPackageAndClass();
    bindCanvasGeometry();

    const revisionBefore = controller.state.currentDocument.revision;

    fireEvent.pointerDown(userNode(), { ...ev, clientX: 320, clientY: 80 });
    fireEvent.pointerUp(window, { ...ev, clientX: 320, clientY: 80 });

    expect(commands).toHaveLength(2);
    expect(controller.state.dragPreview).toBeNull();
    expect(controller.state.currentDocument.revision).toBe(revisionBefore);
    expect(userNode().getAttribute("transform")).toBe("translate(320, 80)");
  });

  it("rejects a MoveNode, restores the preview position, and shows typed feedback", () => {
    const bus = new UmlCommandBus(
      createProjectDocument({
        name: "Reject",
        ownerId,
        idFactory: () => uuid(90),
      }),
    );
    bus.submit({
      kind: "CreatePackage",
      parentPackageId: null,
      value: { id: uuid(1), name: "Domain" },
    });
    bus.submit({
      kind: "CreateClass",
      packageId: uuid(1),
      value: { id: uuid(2), name: "User" },
    });
    const controller = createWorkspaceController({
      adapter: buildStubAdapter(bus.currentDocument, {
        kind: "rejected",
        error: { kind: "precondition-failed", code: "TARGET_NOT_FOUND" },
      }),
    });
    render(<Harness controller={controller} />);
    bindCanvasGeometry();

    const originalTransform = userNode().getAttribute("transform");
    const revisionBefore = controller.state.currentDocument.revision;

    fireEvent.pointerDown(userNode(), { ...ev, clientX: 320, clientY: 80 });
    fireEvent.pointerMove(window, { ...ev, clientX: 350, clientY: 80 });
    expect(userNode().getAttribute("transform")).toBe("translate(350, 80)");

    fireEvent.pointerUp(window, { ...ev, clientX: 350, clientY: 80 });

    expect(userNode().getAttribute("transform")).toBe(originalTransform);
    expect(controller.state.dragPreview).toBeNull();
    expect(controller.state.currentDocument.revision).toBe(revisionBefore);
    const feedback = screen.getByTestId("workspace-feedback");
    expect(feedback.getAttribute("data-error-kind")).toBe("precondition-failed");
    expect(feedback.textContent).toContain("TARGET_NOT_FOUND");
  });

  it("survives Undo/Redo: the committed move reverts and reinstates without extra commands", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([PKG_ID, CLS_ID]),
    );
    render(<Harness controller={controller} />);
    seedPackageAndClass();
    bindCanvasGeometry();

    fireEvent.pointerDown(userNode(), { ...ev, clientX: 320, clientY: 80 });
    fireEvent.pointerMove(window, { ...ev, clientX: 360, clientY: 120 });
    fireEvent.pointerUp(window, { ...ev, clientX: 360, clientY: 120 });
    expect(controller.resolvePosition(CLS_ID)).toEqual({ x: 360, y: 120 });

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(controller.resolvePosition(CLS_ID)).toEqual({ x: 320, y: 80 });
    expect(userNode().getAttribute("transform")).toBe("translate(320, 80)");
    expect(controller.state.dragPreview).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(controller.resolvePosition(CLS_ID)).toEqual({ x: 360, y: 120 });
    expect(userNode().getAttribute("transform")).toBe("translate(360, 120)");
    expect(commands).toHaveLength(3);
  });
});

describe("Workspace keyboard move (Block 5.1)", () => {
  it("moves the focused node with arrows via exactly one MoveNode per key action in diagram space", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([PKG_ID, CLS_ID]),
    );
    render(<Harness controller={controller} />);
    seedPackageAndClass();

    fireEvent.keyDown(userNode(), { key: "ArrowRight" });

    expect(commands).toHaveLength(3);
    expect(commands[2]).toEqual({
      kind: "MoveNode",
      elementId: CLS_ID,
      x: 330,
      y: 80,
    });
    expect(controller.state.selectedElementId).toBe(CLS_ID);
    expect(userNode().getAttribute("transform")).toBe("translate(330, 80)");

    fireEvent.keyDown(userNode(), { key: "ArrowDown" });

    expect(commands).toHaveLength(4);
    expect(commands[3]).toEqual({
      kind: "MoveNode",
      elementId: CLS_ID,
      x: 330,
      y: 90,
    });
    expect(userNode().getAttribute("transform")).toBe("translate(330, 90)");

    fireEvent.keyDown(userNode(), { key: "ArrowLeft" });
    fireEvent.keyDown(userNode(), { key: "ArrowUp" });

    expect(commands).toHaveLength(6);
    expect(commands[4]).toEqual({
      kind: "MoveNode",
      elementId: CLS_ID,
      x: 320,
      y: 90,
    });
    expect(commands[5]).toEqual({
      kind: "MoveNode",
      elementId: CLS_ID,
      x: 320,
      y: 80,
    });
  });

  it("does not move on non-arrow keys and keeps Enter/Space selection behavior intact", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([PKG_ID, CLS_ID]),
    );
    render(<Harness controller={controller} />);
    seedPackageAndClass();

    fireEvent.keyDown(userNode(), { key: "Enter" });
    expect(controller.state.selectedElementId).toBe(CLS_ID);
    expect(commands).toHaveLength(2);

    fireEvent.keyDown(userNode(), { key: " " });
    expect(commands).toHaveLength(2);

    fireEvent.keyDown(userNode(), { key: "a" });
    fireEvent.keyDown(userNode(), { key: "Tab" });
    expect(commands).toHaveLength(2);
    expect(controller.resolvePosition(CLS_ID)).toEqual({ x: 320, y: 80 });
  });
});

describe("Workspace canvas accessibility (Block 5.1)", () => {
  it("exposes the diagram region and every diagrammable node as a focusable keyboard target", () => {
    const { controller } = buildRichController();
    render(<Harness controller={controller} />);

    const canvas = screen.getByTestId("workspace-canvas");
    expect(canvas.getAttribute("role")).toBe("region");
    expect(canvas.getAttribute("aria-label")).toBe("Diagrama de clases");

    const nodes = Array.from(document.querySelectorAll(".uml-workspace__node"));
    expect(nodes.length).toBeGreaterThan(0);
    nodes.forEach((node) => {
      expect(node.getAttribute("role")).toBe("button");
      expect(node.getAttribute("tabindex")).toBe("0");
      expect(node.getAttribute("aria-label")).toBeTruthy();
    });

    const feedbackRegion = screen.getByLabelText("Feedback del modelo");
    expect(feedbackRegion.getAttribute("aria-live")).toBe("polite");
  });
});

describe("Workspace drag gaps (Block 5.1)", () => {
  it("disables rename confirmation for empty or unchanged names and never mutates while disabled", () => {
    const { controller, ids } = buildRichController();
    render(<Harness controller={controller} />);
    fireEvent.click(userNode());

    const editor = screen.getByTestId("inspector-name-input") as HTMLInputElement;
    const confirm = screen.getByTestId("inspector-rename-confirm") as HTMLButtonElement;

    expect(confirm.disabled).toBe(true);

    fireEvent.input(editor, { target: { value: "User " } });
    expect(confirm.disabled).toBe(true);

    fireEvent.input(editor, { target: { value: "" } });
    expect(confirm.disabled).toBe(true);

    fireEvent.input(editor, { target: { value: "Users" } });
    expect(confirm.disabled).toBe(false);
    expect(
      controller.state.currentDocument.uml.classes.find((item) => item.id === ids.classId)
        ?.name,
    ).toBe("User");
  });

  it("clears typed feedback after Undo and keeps it cleared after Redo", () => {
    const { controller } = buildRecordingSession(deterministicIds([uuid(11), uuid(12)]));
    render(<Harness controller={controller} />);

    fireEvent.input(screen.getByLabelText("Nombre del nuevo elemento"), {
      target: { value: "Domain" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear paquete" }));
    fireEvent.input(screen.getByLabelText("Nombre del nuevo elemento"), {
      target: { value: "Domain" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear paquete" }));

    expect(screen.getByTestId("workspace-feedback").textContent).toContain("DUPLICATE_NAME");

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByTestId("workspace-feedback")).toBeNull();
    expect(controller.state.error).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(screen.queryByTestId("workspace-feedback")).toBeNull();
  });

  it("clears the package context when selecting a Class, disabling package-dependent tools", () => {
    const { controller, ids } = buildRichController();
    render(<Harness controller={controller} />);

    fireEvent.click(packageNode());
    expect(controller.state.activePackageId).toBe(ids.pkgId);

    fireEvent.click(userNode());
    expect(controller.state.selectedElementId).toBe(ids.classId);
    expect(controller.state.activePackageId).toBeNull();
    expect(
      (screen.getByRole("button", { name: /Crear clase/ }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: /Crear enumeración/ }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});