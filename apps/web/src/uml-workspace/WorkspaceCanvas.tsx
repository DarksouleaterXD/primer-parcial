import { useRef } from "preact/hooks";

import {
  KEYBOARD_MOVE_DELTA,
  NODE_HEIGHT,
  NODE_WIDTH,
  SVG_MARGIN,
  type ProjectedRelation,
} from "./projection";
import { useWorkspace } from "./WorkspaceContext";
import { ClassNode } from "./ClassNode";
import { EnumerationNode } from "./EnumerationNode";
import { PackageNode } from "./PackageNode";
import { projectWorkspace } from "./projection";
import {
  computeRelationRoutes,
  diamondPoints,
  multiplicityPosition,
  NODE_HEIGHTS,
  relationMidpoint,
  relationPathData,
  type RelationBoxes,
  type RelationRoute,
} from "./relation-routing";
import type { ProjectDocument } from "@primer-parcial/uml-domain";
import type {
  DragRelationAnchor,
  WorkspacePosition,
} from "./workspace-controller";

interface WorkspaceCanvasProps {
  readonly document: ProjectDocument;
  readonly selectedElementId: string | null;
}

interface ActiveDrag {
  readonly elementId: string;
  readonly pointerId: number;
  readonly pointerStart: WorkspacePosition;
  readonly nodeStart: WorkspacePosition;
  active: boolean;
}

interface ViewBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const parseViewBox = (value: string | null): ViewBox | null => {
  if (value === null) {
    return null;
  }
  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
};

export function WorkspaceCanvas({ document, selectedElementId }: WorkspaceCanvasProps) {
  const { controller, requestUpdate } = useWorkspace();
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<ActiveDrag | null>(null);
  const state = controller.state;
  const { dragPreview } = state;

  const resolveRenderedPosition = (elementId: string): WorkspacePosition | null => {
    if (dragPreview !== null && dragPreview.elementId === elementId) {
      return dragPreview.position;
    }
    return controller.resolvePosition(elementId);
  };

  const clientToDiagram = (clientX: number, clientY: number): WorkspacePosition => {
    const svg = svgRef.current;
    if (svg === null) {
      return { x: clientX, y: clientY };
    }
    const rect = svg.getBoundingClientRect();
    const viewBox = parseViewBox(svg.getAttribute("viewBox"));
    if (viewBox === null || rect.width <= 0 || rect.height <= 0) {
      return { x: clientX, y: clientY };
    }
    return {
      x: viewBox.x + ((clientX - rect.left) * viewBox.width) / rect.width,
      y: viewBox.y + ((clientY - rect.top) * viewBox.height) / rect.height,
    };
  };

  const handlePointerDown = (event: PointerEvent, elementId: string): void => {
    if (dragRef.current?.active === true) {
      return;
    }
    event.preventDefault();
    const pointerStart = clientToDiagram(event.clientX, event.clientY);
    const nodeStart = controller.resolvePosition(elementId);
    if (nodeStart === null) {
      return;
    }

    const drag: ActiveDrag = {
      elementId,
      pointerId: event.pointerId,
      pointerStart,
      nodeStart,
      active: true,
    };
    dragRef.current = drag;

    const relationAnchors = new Map<string, DragRelationAnchor>();
    for (const relation of projection.relations) {
      const route = routes.get(relation.relationId);
      if (route === undefined) {
        continue;
      }
      if (relation.fromElementId === elementId) {
        relationAnchors.set(relation.relationId, {
          side: "to",
          endpoint: route.to,
          boundary: route.toBoundary,
          lanePerpendicular: route.lanePerpendicular,
        });
      } else if (relation.toElementId === elementId) {
        relationAnchors.set(relation.relationId, {
          side: "from",
          endpoint: route.from,
          boundary: route.fromBoundary,
          lanePerpendicular: route.lanePerpendicular,
        });
      }
    }

    controller.beginDrag(
      elementId,
      nodeStart,
      relationAnchors.size === 0 ? undefined : relationAnchors,
    );
    requestUpdate();

    const release = (): void => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };

    const onPointerMove = (moveEvent: PointerEvent): void => {
      const current = dragRef.current;
      if (current === null || !current.active || moveEvent.pointerId !== current.pointerId) {
        return;
      }
      const next = clientToDiagram(moveEvent.clientX, moveEvent.clientY);
      controller.updateDrag({
        x: current.nodeStart.x + (next.x - current.pointerStart.x),
        y: current.nodeStart.y + (next.y - current.pointerStart.y),
      });
      requestUpdate();
    };

    const onPointerUp = (upEvent: PointerEvent): void => {
      const current = dragRef.current;
      if (current === null || !current.active || upEvent.pointerId !== current.pointerId) {
        return;
      }
      release();
      controller.endDrag();
      requestUpdate();
    };

    const onPointerCancel = (cancelEvent: PointerEvent): void => {
      const current = dragRef.current;
      if (current === null || !current.active || cancelEvent.pointerId !== current.pointerId) {
        return;
      }
      release();
      controller.cancelDrag();
      requestUpdate();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  };

  const handleKeyDown = (event: KeyboardEvent, elementId: string): void => {
    const dx =
      event.key === "ArrowLeft"
        ? -KEYBOARD_MOVE_DELTA
        : event.key === "ArrowRight"
          ? KEYBOARD_MOVE_DELTA
          : 0;
    const dy =
      event.key === "ArrowUp"
        ? -KEYBOARD_MOVE_DELTA
        : event.key === "ArrowDown"
          ? KEYBOARD_MOVE_DELTA
          : 0;
    if (dx === 0 && dy === 0) {
      return;
    }
    event.preventDefault();
    const current = controller.resolvePosition(elementId);
    if (current === null) {
      return;
    }
    controller.select(elementId);
    controller.submit({ kind: "MoveNode", elementId, x: current.x + dx, y: current.y + dy });
    requestUpdate();
  };

  const projection = projectWorkspace(document, resolveRenderedPosition);

  if (projection.nodes.length === 0) {
    return (
      <div
        class="uml-workspace__canvas"
        data-testid="workspace-canvas-empty"
      >
        <p class="uml-workspace__diagram-empty">No hay elementos en el modelo aún.</p>
      </div>
    );
  }

  const minX = Math.min(
    ...projection.nodes.map((node) => node.position.x - SVG_MARGIN),
    0,
  );
  const minY = Math.min(
    ...projection.nodes.map((node) => node.position.y - SVG_MARGIN),
    0,
  );
  const maxX = Math.max(
    ...projection.nodes.map(
      (node) => node.position.x + NODE_WIDTH + SVG_MARGIN,
    ),
    NODE_WIDTH + SVG_MARGIN * 2,
  );
  const maxY = Math.max(
    ...projection.nodes.map(
      (node) => node.position.y + NODE_HEIGHTS[node.kind] + SVG_MARGIN,
    ),
    NODE_HEIGHT + SVG_MARGIN * 2,
  );
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  const nodeBoxes: RelationBoxes = new Map(
    projection.nodes.map((node) => [
      node.elementId,
      { kind: node.kind, position: node.position },
    ]),
  );
  const routes = computeRelationRoutes(
    projection.relations,
    nodeBoxes,
    dragPreview?.relationAnchors,
  );

  return (
    <svg
      ref={svgRef}
      class="uml-workspace__canvas"
      role="region"
      aria-label="Diagrama de clases"
      tabIndex={0}
      data-testid="workspace-canvas"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x={minX}
        y={minY}
        width={maxX - minX}
        height={maxY - minY}
        fill="transparent"
        onClick={() => {
          controller.select(null);
          requestUpdate();
        }}
        data-testid="canvas-background"
      />
      <defs>
        <marker
          id="uml-workspace-generalization-arrow"
          markerWidth={14}
          markerHeight={14}
          refX={14}
          refY={7}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M14,7 L0,0 L0,14 Z"
            fill="#fffaf0"
            stroke="#213432"
            strokeWidth={1.2}
          />
        </marker>
      </defs>
      {projection.relations.map((relation) => {
        const route = routes.get(relation.relationId);
        if (route === undefined) {
          return null;
        }
        return (
          <RelationLine
            key={relation.relationId}
            relation={relation}
            route={route}
          />
        );
      })}
      {projection.nodes.map((node) => {
        const isSelected = node.elementId === selectedElementId;
        const handleSelect = () => {
          controller.select(node.elementId);
          requestUpdate();
        };
        const nodeContent = (() => {
          if (node.kind === "class") {
            const cls = document.uml.classes.find(({ id }) => id === node.elementId);
            if (cls === undefined) {
              return null;
            }
            return (
              <ClassNode
                key={node.elementId}
                cls={cls}
                position={node.position}
                selected={isSelected}
                onSelect={handleSelect}
              />
            );
          }
          if (node.kind === "enumeration") {
            const enumeration = document.uml.enumerations.find(
              ({ id }) => id === node.elementId,
            );
            if (enumeration === undefined) {
              return null;
            }
            return (
              <EnumerationNode
                key={node.elementId}
                enumeration={enumeration}
                position={node.position}
                selected={isSelected}
                onSelect={handleSelect}
              />
            );
          }
          const pkg = document.uml.packages.find(({ id }) => id === node.elementId);
          if (pkg === undefined) {
            return null;
          }
          return (
            <PackageNode
              key={node.elementId}
              pkg={pkg}
              position={node.position}
              selected={isSelected}
              onSelect={handleSelect}
            />
          );
        })();

        if (nodeContent === null) {
          return null;
        }

        return (
          <g
            key={node.elementId}
            onPointerDown={(event) => handlePointerDown(event, node.elementId)}
            onKeyDown={(event) => handleKeyDown(event, node.elementId)}
          >
            {nodeContent}
          </g>
        );
      })}
    </svg>
  );
}

interface RelationLineProps {
  readonly relation: ProjectedRelation;
  readonly route: RelationRoute;
}

function RelationLine({ relation, route }: RelationLineProps) {
  const mid = relationMidpoint(route);
  const markerEnd =
    relation.kind === "generalization"
      ? "url(#uml-workspace-generalization-arrow)"
      : undefined;
  const fromMultiplicity = multiplicityPosition("from", route);
  const toMultiplicity = multiplicityPosition("to", route);

  return (
    <g class="uml-workspace__relation">
      <path
        class="uml-workspace__relation-path"
        data-kind={relation.kind}
        data-relation-id={relation.relationId}
        d={relationPathData(route)}
        fill="none"
        stroke="#213432"
        strokeWidth={1}
        {...(markerEnd === undefined ? {} : { "marker-end": markerEnd })}
      />
      {relation.label !== undefined && (
        <text
          class="uml-workspace__relation-label"
          x={mid.x}
          y={mid.y - 4}
          textAnchor="middle"
          fill="#213432"
        >
          {relation.label}
        </text>
      )}
      {relation.multiplicityFrom !== undefined && (
        <text
          class="uml-workspace__relation-label"
          data-multiplicity="from"
          x={fromMultiplicity.x}
          y={fromMultiplicity.y}
          fill="#213432"
        >
          {relation.multiplicityFrom}
        </text>
      )}
      {relation.multiplicityTo !== undefined && (
        <text
          class="uml-workspace__relation-label"
          data-multiplicity="to"
          x={toMultiplicity.x}
          y={toMultiplicity.y}
          fill="#213432"
        >
          {relation.multiplicityTo}
        </text>
      )}
      {relation.aggregationFrom !== "none" && (
        <polygon
          points={diamondPoints("from", route)}
          fill={relation.aggregationFrom === "composite" ? "#213432" : "#fffaf0"}
          stroke="#213432"
          strokeWidth={1}
          data-testid={`aggregation-${relation.aggregationFrom}`}
          data-aggregation-side="from"
        />
      )}
      {relation.aggregationTo !== "none" && (
        <polygon
          points={diamondPoints("to", route)}
          fill={relation.aggregationTo === "composite" ? "#213432" : "#fffaf0"}
          stroke="#213432"
          strokeWidth={1}
          data-testid={`aggregation-${relation.aggregationTo}`}
          data-aggregation-side="to"
        />
      )}
    </g>
  );
}
