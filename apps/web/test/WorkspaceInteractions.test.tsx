import { cleanup, fireEvent, render, screen, within } from "@testing-library/preact";
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "preact/hooks";

import {
  createProjectDocument,
  type UmlCommand,
} from "@primer-parcial/uml-domain";

import { UmlWorkspace } from "../src/uml-workspace/UmlWorkspace";
import { WorkspaceContext } from "../src/uml-workspace/WorkspaceContext";
import { WorkspaceToolbar } from "../src/uml-workspace/WorkspaceToolbar";
import { WorkspaceToolbox } from "../src/uml-workspace/WorkspaceToolbox";
import { WorkspaceCanvas } from "../src/uml-workspace/WorkspaceCanvas";
import { WorkspaceInspector } from "../src/uml-workspace/WorkspaceInspector";
import { WorkspaceFeedback } from "../src/uml-workspace/WorkspaceFeedback";
import {
  createWorkspaceController,
  type WorkspaceController,
} from "../src/uml-workspace/workspace-controller";
import {
  ownerId,
  buildRichController,
  buildRecordingSession,
  buildStubAdapter,
  deterministicIds,
} from "./workspace-helpers";

afterEach(() => {
  cleanup();
});

const uuid = (value: number): string =>
  `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const PKG_1 = uuid(1);
const PKG_2 = uuid(2);
const PKG_3 = uuid(3);
const CLS_1 = uuid(4);
const ENUM_1 = uuid(5);

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

const nameInput = (): HTMLInputElement =>
  screen.getByLabelText("Nombre del nuevo elemento") as HTMLInputElement;

const packageButton = (): HTMLButtonElement =>
  screen.getByRole("button", { name: "Crear paquete" }) as HTMLButtonElement;

const classButton = (): HTMLButtonElement =>
  screen.getByRole("button", { name: /Crear clase/ }) as HTMLButtonElement;

const enumButton = (): HTMLButtonElement =>
  screen.getByRole("button", { name: /Crear enumeración/ }) as HTMLButtonElement;

describe("Workspace toolbox (Block 4.1)", () => {
  it("creates a root package with the exact closed envelope, caller ID and required name", () => {
    const { controller, commands } = buildRecordingSession(deterministicIds([PKG_1]));
    render(<Harness controller={controller} />);

    fireEvent.input(nameInput(), { target: { value: "Domain" } });
    fireEvent.click(packageButton());

    expect(commands).toEqual([
      { kind: "CreatePackage", parentPackageId: null, value: { id: PKG_1, name: "Domain" } },
    ]);
    expect(controller.state.currentDocument.uml.packages).toEqual([
      expect.objectContaining({ id: PKG_1, name: "Domain" }),
    ]);
    expect(nameInput().value).toBe("");
  });

  it("creates a class inside the selected package with value carrying only id and name", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([PKG_1, CLS_1]),
    );
    render(<Harness controller={controller} />);

    fireEvent.input(nameInput(), { target: { value: "Domain" } });
    fireEvent.click(packageButton());
    fireEvent.click(screen.getByText("«package» Domain").closest("g")!);

    fireEvent.input(nameInput(), { target: { value: "User" } });
    fireEvent.click(classButton());

    expect(commands[1]).toEqual({
      kind: "CreateClass",
      packageId: PKG_1,
      value: { id: CLS_1, name: "User" },
    });
    expect(Object.keys((commands[1] as { value: object }).value).sort()).toEqual(["id", "name"]);
  });

  it("creates an enumeration inside the selected package with value carrying only id and name", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([PKG_1, ENUM_1]),
    );
    render(<Harness controller={controller} />);

    fireEvent.input(nameInput(), { target: { value: "Domain" } });
    fireEvent.click(packageButton());
    fireEvent.click(screen.getByText("«package» Domain").closest("g")!);

    fireEvent.input(nameInput(), { target: { value: "Role" } });
    fireEvent.click(enumButton());

    expect(commands[1]).toEqual({
      kind: "CreateEnumeration",
      packageId: PKG_1,
      value: { id: ENUM_1, name: "Role" },
    });
    expect(Object.keys((commands[1] as { value: object }).value).sort()).toEqual(["id", "name"]);
  });

  it("disables Package without a name and Class/Enumeration without a selected package, sending nothing", () => {
    const { controller, commands } = buildRecordingSession(deterministicIds([PKG_1]));
    render(<Harness controller={controller} />);

    expect(packageButton().disabled).toBe(true);
    expect(classButton().disabled).toBe(true);
    expect(enumButton().disabled).toBe(true);
    expect(classButton().getAttribute("aria-label")).toContain("requiere seleccionar un paquete");

    fireEvent.input(nameInput(), { target: { value: "Domain" } });
    expect(packageButton().disabled).toBe(false);
    expect(classButton().disabled).toBe(true);
    expect(enumButton().disabled).toBe(true);

    fireEvent.click(classButton());
    fireEvent.click(enumButton());
    expect(commands).toEqual([]);
  });

  it("never creates nested packages: Package always submits parentPackageId null", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([PKG_1, PKG_2]),
    );
    render(<Harness controller={controller} />);

    fireEvent.input(nameInput(), { target: { value: "Root" } });
    fireEvent.click(packageButton());
    fireEvent.click(screen.getByText("«package» Root").closest("g")!);

    fireEvent.input(nameInput(), { target: { value: "Nested" } });
    fireEvent.click(packageButton());

    expect(commands[1]).toEqual({
      kind: "CreatePackage",
      parentPackageId: null,
      value: { id: PKG_2, name: "Nested" },
    });
    expect(
      controller.state.currentDocument.uml.packages.every(
        (item) => item.parentPackageId === undefined,
      ),
    ).toBe(true);
  });
});

describe("Workspace inspector rename (Block 4.2)", () => {
  it("renames a selected class with RenameClass carrying only the target and replacement name", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([PKG_1, CLS_1]),
    );
    render(<Harness controller={controller} />);

    fireEvent.input(nameInput(), { target: { value: "Domain" } });
    fireEvent.click(packageButton());
    fireEvent.click(screen.getByText("«package» Domain").closest("g")!);
    fireEvent.input(nameInput(), { target: { value: "User" } });
    fireEvent.click(classButton());

    fireEvent.click(screen.getByText("User").closest("g")!);
    const editor = screen.getByTestId("inspector-name-input") as HTMLInputElement;
    expect(editor.value).toBe("User");

    fireEvent.input(editor, { target: { value: "Customer" } });
    fireEvent.click(screen.getByTestId("inspector-rename-confirm"));

    expect(commands[2]).toEqual({ kind: "RenameClass", classId: CLS_1, name: "Customer" });
    expect(Object.keys(commands[2] as object).sort()).toEqual(["classId", "kind", "name"]);
    expect(controller.state.currentDocument.uml.classes[0].name).toBe("Customer");
  });

  it("renames a selected enumeration with RenameEnumeration carrying only the target and replacement name", () => {
    const { controller, commands } = buildRecordingSession(
      deterministicIds([PKG_1, ENUM_1]),
    );
    render(<Harness controller={controller} />);

    fireEvent.input(nameInput(), { target: { value: "Domain" } });
    fireEvent.click(packageButton());
    fireEvent.click(screen.getByText("«package» Domain").closest("g")!);
    fireEvent.input(nameInput(), { target: { value: "Role" } });
    fireEvent.click(enumButton());

    fireEvent.click(screen.getByText(/«enumeration» Role/).closest("g")!);
    const editor = screen.getByTestId("inspector-name-input") as HTMLInputElement;
    fireEvent.input(editor, { target: { value: "Status" } });
    fireEvent.click(screen.getByTestId("inspector-rename-confirm"));

    expect(commands[2]).toEqual({
      kind: "RenameEnumeration",
      enumerationId: ENUM_1,
      name: "Status",
    });
    expect(controller.state.currentDocument.uml.enumerations[0].name).toBe("Status");
  });

  it("keeps a selected Package read-only with no editable control", () => {
    const { controller } = buildRichController();
    render(<Harness controller={controller} />);

    fireEvent.click(screen.getByText("«package» Domain").closest("g")!);

    const inspector = screen.getByLabelText("Inspector");
    expect(within(inspector).getByText("Paquete")).toBeTruthy();
    expect(within(inspector).queryByRole("textbox")).toBeNull();
    expect(within(inspector).queryByTestId("inspector-rename-confirm")).toBeNull();
    expect(within(inspector).queryByTestId("inspector-name-input")).toBeNull();
  });

  it("clears selection, inspector and package context when Undo removes the selected element", () => {
    const { controller } = buildRecordingSession(deterministicIds([PKG_1]));
    render(<Harness controller={controller} />);

    fireEvent.input(nameInput(), { target: { value: "Domain" } });
    fireEvent.click(packageButton());
    fireEvent.click(screen.getByText("«package» Domain").closest("g")!);
    expect(controller.state.activePackageId).toBe(PKG_1);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(controller.state.selectedElementId).toBeNull();
    expect(controller.state.activePackageId).toBeNull();
    expect(screen.getByTestId("inspector-empty")).toBeTruthy();
    expect(document.querySelectorAll(".uml-workspace__node").length).toBe(0);
  });
});

describe("Workspace typed feedback (Block 4.3)", () => {
  const emptyDocument = () =>
    createProjectDocument({ name: "Stub", ownerId, idFactory: () => uuid(90) });

  it("renders unsupported-command with its kind and clears only on dismiss", () => {
    const controller = createWorkspaceController({
      adapter: buildStubAdapter(emptyDocument(), {
        kind: "rejected",
        error: { kind: "unsupported-command" },
      }),
    });
    controller.submit({ kind: "Unknown" } as unknown as UmlCommand);
    render(<Harness controller={controller} />);

    const feedback = screen.getByTestId("workspace-feedback");
    expect(feedback.getAttribute("data-error-kind")).toBe("unsupported-command");
    expect(feedback.textContent).toContain("unsupported-command");

    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
    expect(screen.queryByTestId("workspace-feedback")).toBeNull();
  });

  it("renders precondition-failed with its public code", () => {
    const controller = createWorkspaceController({
      adapter: buildStubAdapter(emptyDocument(), {
        kind: "rejected",
        error: { kind: "precondition-failed", code: "TARGET_NOT_FOUND" },
      }),
    });
    controller.submit({ kind: "RenameClass", classId: CLS_1, name: "y" });
    render(<Harness controller={controller} />);

    const feedback = screen.getByTestId("workspace-feedback");
    expect(feedback.getAttribute("data-error-kind")).toBe("precondition-failed");
    expect(feedback.textContent).toContain("precondition-failed");
    expect(feedback.textContent).toContain("TARGET_NOT_FOUND");
  });

  it("renders each validation diagnostic with severity, code, message and element reference", () => {
    const controller = createWorkspaceController({
      adapter: buildStubAdapter(emptyDocument(), {
        kind: "rejected",
        error: {
          kind: "validation-failed",
          diagnostics: [
            {
              severity: "error",
              code: "UML_NAME_REQUIRED",
              message: "Class name is required.",
              path: "uml.classes[0].name",
              elementId: CLS_1,
            },
          ],
        },
      }),
    });
    controller.submit({ kind: "RenameClass", classId: CLS_1, name: "" });
    render(<Harness controller={controller} />);

    const diagnostics = screen.getByTestId("feedback-diagnostics");
    expect(diagnostics.textContent).toContain("error");
    expect(diagnostics.textContent).toContain("UML_NAME_REQUIRED");
    expect(diagnostics.textContent).toContain("Class name is required.");
    expect(diagnostics.textContent).toContain(CLS_1);
  });

  it("encapsulates VALIDATION_INTERNAL_ERROR as a safe typed diagnostic", () => {
    const controller = createWorkspaceController({
      adapter: buildStubAdapter(emptyDocument(), {
        kind: "rejected",
        error: {
          kind: "validation-failed",
          diagnostics: [
            {
              severity: "error",
              code: "VALIDATION_INTERNAL_ERROR",
              message: "Command execution failed internally.",
              path: "$",
            },
          ],
        },
      }),
    });
    controller.submit({ kind: "RenameClass", classId: CLS_1, name: "x" });
    render(<Harness controller={controller} />);

    const feedback = screen.getByTestId("workspace-feedback");
    expect(feedback.textContent).toContain("VALIDATION_INTERNAL_ERROR");
    expect(feedback.textContent).toContain("Command execution failed internally.");
    expect(feedback.textContent).not.toContain("stack");
  });

  it("retains a rejection and clears it only after a later accepted command", () => {
    const { controller } = buildRecordingSession(
      deterministicIds([PKG_1, PKG_2, PKG_3]),
    );
    render(<Harness controller={controller} />);

    fireEvent.input(nameInput(), { target: { value: "Domain" } });
    fireEvent.click(packageButton());
    fireEvent.input(nameInput(), { target: { value: "Domain" } });
    fireEvent.click(packageButton());

    expect(screen.getByTestId("workspace-feedback").textContent).toContain("DUPLICATE_NAME");

    fireEvent.input(nameInput(), { target: { value: "Application" } });
    fireEvent.click(packageButton());

    expect(screen.queryByTestId("workspace-feedback")).toBeNull();
  });

  it("announces feedback without moving focus away from the originating control", () => {
    const { controller } = buildRecordingSession(deterministicIds([PKG_1, PKG_2]));
    render(<Harness controller={controller} />);

    fireEvent.input(nameInput(), { target: { value: "Domain" } });
    const button = packageButton();
    button.focus();
    fireEvent.click(button);
    fireEvent.input(nameInput(), { target: { value: "Domain" } });
    fireEvent.click(button);

    expect(screen.getByTestId("workspace-feedback")).toBeTruthy();
    expect(document.activeElement).toBe(button);
  });
});

describe("Workspace history controls (Block 4.4)", () => {
  it("drives Undo/Redo exclusively through canUndo/canRedo and reprojects restored snapshots", () => {
    const { controller } = buildRecordingSession(deterministicIds([PKG_1, PKG_2]));
    render(<Harness controller={controller} />);

    const undoButton = screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement;
    const redoButton = screen.getByRole("button", { name: "Redo" }) as HTMLButtonElement;
    expect(undoButton.disabled).toBe(true);
    expect(redoButton.disabled).toBe(true);

    fireEvent.input(nameInput(), { target: { value: "A" } });
    fireEvent.click(packageButton());
    expect(undoButton.disabled).toBe(false);
    expect(redoButton.disabled).toBe(true);

    fireEvent.click(undoButton);
    expect(controller.state.currentDocument.uml.packages.length).toBe(0);
    expect(redoButton.disabled).toBe(false);

    fireEvent.click(redoButton);
    expect(controller.state.currentDocument.uml.packages.length).toBe(1);

    fireEvent.click(undoButton);
    expect(redoButton.disabled).toBe(false);

    fireEvent.input(nameInput(), { target: { value: "B" } });
    fireEvent.click(packageButton());
    expect(redoButton.disabled).toBe(true);
    expect(controller.state.currentDocument.uml.packages[0].name).toBe("B");
  });

  it("leaves state untouched when a disabled history control is activated", () => {
    const { controller } = buildRecordingSession(deterministicIds([PKG_1]));
    render(<Harness controller={controller} />);

    const undoButton = screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement;
    const redoButton = screen.getByRole("button", { name: "Redo" }) as HTMLButtonElement;

    fireEvent.click(undoButton);
    fireEvent.click(redoButton);

    expect(controller.state.currentDocument.uml.packages.length).toBe(0);
    expect(controller.state.currentDocument.revision).toBe(0);
    expect(undoButton.disabled).toBe(true);
    expect(redoButton.disabled).toBe(true);
  });
});

describe("Workspace no-mutation (Block 4)", () => {
  it("does not mutate the document while typing a rename draft, only after confirmation", () => {
    const { controller, ids } = buildRichController();
    render(<Harness controller={controller} />);

    fireEvent.click(screen.getByText("User").closest("g")!);
    const before = JSON.stringify(controller.state.currentDocument);
    const revisionBefore = controller.state.currentDocument.revision;

    const editor = screen.getByTestId("inspector-name-input") as HTMLInputElement;
    fireEvent.input(editor, { target: { value: "Draft" } });

    expect(JSON.stringify(controller.state.currentDocument)).toBe(before);
    expect(controller.state.currentDocument.revision).toBe(revisionBefore);

    fireEvent.click(screen.getByTestId("inspector-rename-confirm"));
    expect(
      controller.state.currentDocument.uml.classes.find((item) => item.id === ids.classId)?.name,
    ).toBe("Draft");
  });
});

describe("Block 3 regression preserved", () => {
  it("selects a node with Enter and Space, reflects node--selected/aria-selected, and clears on background click", () => {
    const { controller, ids } = buildRichController();
    render(<Harness controller={controller} />);

    const node = screen.getByText("User").closest("g")!;
    fireEvent.keyDown(node, { key: "Enter" });
    expect(controller.state.selectedElementId).toBe(ids.classId);
    expect(node.classList.contains("uml-workspace__node--selected")).toBe(true);
    expect(node.getAttribute("aria-selected")).toBe("true");

    fireEvent.click(screen.getByTestId("canvas-background"));
    expect(controller.state.selectedElementId).toBeNull();
    expect(screen.getByTestId("inspector-empty")).toBeTruthy();

    const enumerationNode = screen.getByText(/«enumeration» Role/).closest("g")!;
    fireEvent.keyDown(enumerationNode, { key: " " });
    expect(controller.state.selectedElementId).toBe(ids.enumId);
  });

  it("keeps the authorized shell mount and history controls present after Block 4", () => {
    render(<UmlWorkspace ownerId={ownerId} idFactory={() => uuid(91)} />);

    expect(screen.getByText("Modelo UML")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Crear paquete" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Redo" })).toBeTruthy();
    expect(screen.getByTestId("workspace-canvas-empty")).toBeTruthy();
  });
});
