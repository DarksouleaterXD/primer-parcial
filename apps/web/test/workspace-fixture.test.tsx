import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it } from "vitest";

import { validateProjectDocument } from "@primer-parcial/uml-domain";

import { projectWorkspace } from "../src/uml-workspace/projection";
import {
  computeRelationRoutes,
  multiplicityPosition,
  relationPathData,
  relationMidpoint,
} from "../src/uml-workspace/relation-routing";
import { WorkspaceDevHarness } from "../src/uml-workspace/WorkspaceDevHarness";
import { WorkspaceView } from "../src/uml-workspace/WorkspaceView";
import type { WorkspaceController } from "../src/uml-workspace/workspace-controller";
import {
  createRelationsFixtureDocument,
  createWorkspaceSessionFromDocument,
  FIXTURE_IDS,
  RELATIONS_FIXTURE_FALLBACK,
  RELATIONS_FIXTURE_LAYOUT,
} from "../src/uml-workspace/workspace-fixture";

afterEach(() => {
  cleanup();
});

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
    toJSON: () => ({ x, y, width, height, top: y, right: x + width, bottom: y + height, left: x }),
  });
};

const relationPaths = (): string[] =>
  Array.from(
    document.querySelectorAll<SVGPathElement>(".uml-workspace__relation-path"),
  ).map((path) => path.getAttribute("d") ?? "");

const expectedRelationPaths = (controller: WorkspaceController): string[] => {
  const projection = projectWorkspace(
    controller.state.currentDocument,
    controller.resolvePosition,
  );
  const boxes = new Map(
    projection.nodes.map((node) => [
      node.elementId,
      { kind: node.kind, position: node.position },
    ]),
  );
  const routes = computeRelationRoutes(projection.relations, boxes);
  return projection.relations.map((relation) =>
    relationPathData(routes.get(relation.relationId)!),
  );
};

describe("workspace relations fixture", () => {
  it("is deterministic and passes the domain save policy", () => {
    const first = createRelationsFixtureDocument();
    const second = createRelationsFixtureDocument();

    expect(validateProjectDocument(first, "save").blocked).toBe(false);
    expect(second).toEqual(first);
  });

  it("seeds a session without mutating the fixture and projects 4 nodes and 3 relations", () => {
    const fixture = createRelationsFixtureDocument();
    const snapshot = JSON.stringify(fixture);

    const controller = createWorkspaceSessionFromDocument(fixture);

    expect(JSON.stringify(fixture)).toBe(snapshot);

    const document = controller.state.currentDocument;
    expect(document.uml.packages.map(({ id }) => id)).toEqual([FIXTURE_IDS.package]);
    expect(document.uml.classes.map(({ id }) => id)).toEqual([
      FIXTURE_IDS.userClass,
      FIXTURE_IDS.adminClass,
    ]);
    expect(document.uml.enumerations.map(({ id }) => id)).toEqual([FIXTURE_IDS.roleEnum]);
    expect(document.uml.associations).toHaveLength(2);
    expect(document.uml.generalizations).toHaveLength(1);

    const projection = projectWorkspace(document, controller.resolvePosition);
    expect(projection.nodes.map(({ kind }) => kind).sort()).toEqual([
      "class",
      "class",
      "enumeration",
      "package",
    ]);
    expect(projection.relations.filter(({ kind }) => kind === "association")).toHaveLength(2);
    expect(projection.relations.filter(({ kind }) => kind === "generalization")).toHaveLength(1);
  });

  it("honors explicit layout and falls back deterministically for the node without layout", () => {
    const controller = createWorkspaceSessionFromDocument(createRelationsFixtureDocument());

    expect(controller.resolvePosition(FIXTURE_IDS.package)).toEqual(
      RELATIONS_FIXTURE_LAYOUT.package,
    );
    expect(controller.resolvePosition(FIXTURE_IDS.userClass)).toEqual(
      RELATIONS_FIXTURE_LAYOUT.userClass,
    );
    expect(controller.resolvePosition(FIXTURE_IDS.roleEnum)).toEqual(
      RELATIONS_FIXTURE_LAYOUT.roleEnum,
    );
    expect(controller.resolvePosition(FIXTURE_IDS.adminClass)).toEqual(
      RELATIONS_FIXTURE_FALLBACK.adminClass,
    );
    expect(
      controller.state.currentDocument.layout.nodes.some(
        ({ elementId }) => elementId === FIXTURE_IDS.adminClass,
      ),
    ).toBe(false);
  });

  it("materializes the fallback node only through MoveNode and follows it in the projection", () => {
    const controller = createWorkspaceSessionFromDocument(createRelationsFixtureDocument());

    expect(
      controller.submit({
        kind: "MoveNode",
        elementId: FIXTURE_IDS.adminClass,
        x: 720,
        y: 480,
      }),
    ).toBe(true);
    expect(controller.state.currentDocument.layout.nodes).toContainEqual({
      elementId: FIXTURE_IDS.adminClass,
      x: 720,
      y: 480,
    });

    const projection = projectWorkspace(
      controller.state.currentDocument,
      controller.resolvePosition,
    );
    expect(
      projection.relations.find(({ kind }) => kind === "generalization"),
    ).toMatchObject({
      fromElementId: FIXTURE_IDS.adminClass,
      toElementId: FIXTURE_IDS.userClass,
      from: { x: 720, y: 480 },
      to: RELATIONS_FIXTURE_LAYOUT.userClass,
    });
  });
});

describe("workspace relations fixture rendering", () => {
  it("renders both associations, the generalization, multiplicities and aggregation markers", () => {
    const controller = createWorkspaceSessionFromDocument(createRelationsFixtureDocument());
    render(<WorkspaceView controller={controller} />);

    expect(document.querySelectorAll(".uml-workspace__node").length).toBe(4);
    expect(document.querySelectorAll(".uml-workspace__relation").length).toBe(3);
    expect(document.querySelectorAll(".uml-workspace__relation-path").length).toBe(3);
    expect(screen.getByText("manages")).toBeTruthy();
    expect(screen.getByText("defines")).toBeTruthy();
    expect(screen.getByLabelText("Enumeración Role")).toBeTruthy();
    expect(screen.queryAllByText("1..1").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText("0..*").length).toBeGreaterThanOrEqual(1);

    // Shared and composite aggregation diamonds come from the fixture ends.
    expect(
      document.querySelector('[data-testid="aggregation-shared"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-testid="aggregation-composite"]'),
    ).toBeTruthy();

    // The generalization ends in a hollow UML triangle reaching the parent boundary.
    const generalizationPath = document.querySelector(
      '.uml-workspace__relation-path[data-kind="generalization"]',
    );
    expect(generalizationPath?.getAttribute("marker-end")).toBe(
      "url(#uml-workspace-generalization-arrow)",
    );
    const markerPath = document.querySelector("#uml-workspace-generalization-arrow path");
    expect(markerPath?.getAttribute("d")).toBe("M14,7 L0,0 L0,14 Z");
    expect(markerPath?.getAttribute("fill")).toBe("#fffaf0");

    // The three geometries are distinct and none repeats the old center-to-center overlap.
    const paths = relationPaths();
    expect(new Set(paths).size).toBe(3);
    expect(paths).not.toContain("M 190 305 L 670 105");
    const pathById = (id: string) =>
      document
        .querySelector(`.uml-workspace__relation-path[data-relation-id="${id}"]`)
        ?.getAttribute("d");
    expect(pathById(FIXTURE_IDS.managesAssociation)).not.toBe(
      pathById(FIXTURE_IDS.generalization),
    );
  });

  it("moves the association and generalization paths when the fallback node is dragged", () => {
    const controller = createWorkspaceSessionFromDocument(createRelationsFixtureDocument());
    render(<WorkspaceView controller={controller} />);
    bindCanvasGeometry();

    expect(relationPaths()).toEqual(expectedRelationPaths(controller));

    const admin = screen.getByLabelText("Clase Admin");
    fireEvent.pointerDown(admin, { pointerId: 1, clientX: 80, clientY: 260 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 720, clientY: 480 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 720, clientY: 480 });

    expect(relationPaths()).toEqual(expectedRelationPaths(controller));
    expect(relationPaths()).not.toEqual(
      expectedRelationPaths(
        createWorkspaceSessionFromDocument(createRelationsFixtureDocument()),
      ),
    );
    expect(document.querySelectorAll(".uml-workspace__node").length).toBe(4);
  });

  it("keeps the User anchors and relation lanes stable while Admin follows the drag preview", () => {
    const fixture = createRelationsFixtureDocument();
    const fixtureSnapshot = JSON.stringify(fixture);
    const controller = createWorkspaceSessionFromDocument(fixture);
    const documentSnapshot = JSON.stringify(controller.state.currentDocument);
    render(<WorkspaceView controller={controller} />);
    bindCanvasGeometry();

    const initialProjection = projectWorkspace(
      controller.state.currentDocument,
      controller.resolvePosition,
    );
    const initialBoxes = new Map(
      initialProjection.nodes.map((node) => [
        node.elementId,
        { kind: node.kind, position: node.position },
      ]),
    );
    const initialRoutes = computeRelationRoutes(initialProjection.relations, initialBoxes);
    const initialManages = initialRoutes.get(FIXTURE_IDS.managesAssociation)!;
    const initialGeneralization = initialRoutes.get(FIXTURE_IDS.generalization)!;
    const pathById = (id: string) =>
      document
        .querySelector(`.uml-workspace__relation-path[data-relation-id="${id}"]`)
        ?.getAttribute("d");
    const groupById = (id: string) =>
      document.querySelector(`.uml-workspace__relation-path[data-relation-id="${id}"]`)
        ?.parentElement!;
    const managesPathBefore = pathById(FIXTURE_IDS.managesAssociation);
    const generalizationPathBefore = pathById(FIXTURE_IDS.generalization);

    fireEvent.pointerDown(screen.getByLabelText("Clase Admin"), {
      pointerId: 1,
      clientX: 80,
      clientY: 260,
    });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 460, clientY: 400 });
    const firstPreviewPosition = controller.state.dragPreview!.position;
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 500, clientY: 440 });

    const preview = controller.state.dragPreview!;
    expect(preview.position).not.toEqual(firstPreviewPosition);
    expect(preview.relationAnchors?.get(FIXTURE_IDS.managesAssociation)?.side).toBe("from");
    expect(preview.relationAnchors?.get(FIXTURE_IDS.generalization)?.side).toBe("to");
    expect(JSON.stringify(fixture)).toBe(fixtureSnapshot);
    expect(JSON.stringify(controller.state.currentDocument)).toBe(documentSnapshot);

    const previewProjection = projectWorkspace(controller.state.currentDocument, (elementId) =>
      elementId === preview.elementId
        ? preview.position
        : controller.resolvePosition(elementId),
    );
    const previewBoxes = new Map(
      previewProjection.nodes.map((node) => [
        node.elementId,
        { kind: node.kind, position: node.position },
      ]),
    );
    const previewRoutes = computeRelationRoutes(
      previewProjection.relations,
      previewBoxes,
      preview.relationAnchors,
    );
    const previewManages = previewRoutes.get(FIXTURE_IDS.managesAssociation)!;
    const previewGeneralization = previewRoutes.get(FIXTURE_IDS.generalization)!;

    expect(previewManages.from).toEqual(initialManages.from);
    expect(previewManages.fromBoundary).toEqual(initialManages.fromBoundary);
    expect(previewGeneralization.to).toEqual(initialGeneralization.to);
    expect(previewGeneralization.toBoundary).toEqual(initialGeneralization.toBoundary);
    expect(previewManages.lanePerpendicular).toEqual(initialManages.lanePerpendicular);
    expect(previewGeneralization.lanePerpendicular).toEqual(
      initialGeneralization.lanePerpendicular,
    );
    expect(previewManages.control).not.toEqual(previewGeneralization.control);
    expect(pathById(FIXTURE_IDS.managesAssociation)).toBe(relationPathData(previewManages));
    expect(pathById(FIXTURE_IDS.generalization)).toBe(
      relationPathData(previewGeneralization),
    );
    expect(pathById(FIXTURE_IDS.managesAssociation)).not.toBe(managesPathBefore);
    expect(pathById(FIXTURE_IDS.generalization)).not.toBe(generalizationPathBefore);

    const managesGroup = groupById(FIXTURE_IDS.managesAssociation)!;
    expect(managesGroup.textContent).toContain("manages");
    expect(managesGroup.textContent).toContain("1..1");
    expect(managesGroup.textContent).toContain("0..*");
    expect(managesGroup.querySelector('[data-testid="aggregation-shared"]')).toBeTruthy();
    expect(
      groupById(FIXTURE_IDS.generalization)?.querySelector(".uml-workspace__relation-path")
        ?.getAttribute("marker-end"),
    ).toBe("url(#uml-workspace-generalization-arrow)");
    expect(managesGroup.querySelector(".uml-workspace__relation-label")?.getAttribute("x")).toBe(
      String(relationMidpoint(previewManages).x),
    );
    expect(
      managesGroup.querySelector('[data-multiplicity="from"]')?.getAttribute("x"),
    ).toBe(String(multiplicityPosition("from", previewManages).x));

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 500, clientY: 440 });
    expect(controller.state.dragPreview).toBeNull();
    expect(controller.resolvePosition(FIXTURE_IDS.adminClass)).toEqual(preview.position);
    controller.undo();
    expect(controller.resolvePosition(FIXTURE_IDS.adminClass)).toEqual(
      RELATIONS_FIXTURE_FALLBACK.adminClass,
    );
    controller.redo();
    expect(controller.resolvePosition(FIXTURE_IDS.adminClass)).toEqual(preview.position);
  });

  it("mounts the development harness with the fixture document", () => {
    render(<WorkspaceDevHarness />);

    expect(screen.getByLabelText("Diagrama de clases")).toBeTruthy();
    expect(document.querySelectorAll(".uml-workspace__node").length).toBe(4);
    expect(document.querySelectorAll(".uml-workspace__relation").length).toBe(3);
  });
});
