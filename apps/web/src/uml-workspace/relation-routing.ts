import type { ProjectedRelation } from "./projection";
import { NODE_HEIGHT, NODE_WIDTH } from "./projection";
import type {
  DragRelationAnchor,
  WorkspacePosition,
} from "./workspace-controller";

export type DiagramNodeKind = "package" | "class" | "enumeration";

export interface RelationNodeBox {
  readonly kind: DiagramNodeKind;
  readonly position: WorkspacePosition;
}

export type RelationBoxes = ReadonlyMap<string, RelationNodeBox>;

export interface RelationRoute {
  readonly relationId: string;
  readonly from: WorkspacePosition;
  readonly to: WorkspacePosition;
  readonly fromBoundary: WorkspacePosition;
  readonly toBoundary: WorkspacePosition;
  readonly direction: WorkspacePosition;
  readonly perpendicular: WorkspacePosition;
  readonly lanePerpendicular: WorkspacePosition;
  readonly control: WorkspacePosition | null;
}

export const NODE_HEIGHTS: Record<DiagramNodeKind, number> = {
  package: 50,
  class: NODE_HEIGHT,
  enumeration: 70,
};

export const AGGREGATION_HALF = 5;
export const BEND_STEP = 22;
const MULTIPLICITY_OUT_GAP = 12;
const MULTIPLICITY_SIDE_GAP = 10;

const pairKey = (firstId: string, secondId: string): string =>
  firstId < secondId ? `${firstId}|${secondId}` : `${secondId}|${firstId}`;

const boxCenter = (box: RelationNodeBox): WorkspacePosition => ({
  x: box.position.x + NODE_WIDTH / 2,
  y: box.position.y + NODE_HEIGHTS[box.kind] / 2,
});

const boundaryPoint = (
  box: RelationNodeBox,
  from: WorkspacePosition,
): WorkspacePosition => {
  const center = boxCenter(box);
  const dx = center.x - from.x;
  const dy = center.y - from.y;
  if (dx === 0 && dy === 0) {
    return center;
  }
  const halfW = NODE_WIDTH / 2;
  const halfH = NODE_HEIGHTS[box.kind] / 2;
  let tEnter = 0;
  if (dx !== 0) {
    const nearX = dx > 0 ? center.x - halfW : center.x + halfW;
    tEnter = Math.max(tEnter, (nearX - from.x) / dx);
  }
  if (dy !== 0) {
    const nearY = dy > 0 ? center.y - halfH : center.y + halfH;
    tEnter = Math.max(tEnter, (nearY - from.y) / dy);
  }
  if (!(tEnter > 0) || !(tEnter < 1)) {
    return center;
  }
  return { x: from.x + tEnter * dx, y: from.y + tEnter * dy };
};

const unitVector = (
  from: WorkspacePosition,
  to: WorkspacePosition,
): WorkspacePosition => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return { x: 0, y: -1 };
  }
  return { x: dx / length, y: dy / length };
};

const aggregationOuter = (
  boundary: WorkspacePosition,
  direction: WorkspacePosition,
  sign: 1 | -1,
): WorkspacePosition => ({
  x: boundary.x + direction.x * sign * AGGREGATION_HALF * 2,
  y: boundary.y + direction.y * sign * AGGREGATION_HALF * 2,
});

export const computeRelationRoutes = (
  relations: readonly ProjectedRelation[],
  boxes: RelationBoxes,
  previewAnchors?: ReadonlyMap<string, DragRelationAnchor>,
): ReadonlyMap<string, RelationRoute> => {
  const groups = new Map<string, ProjectedRelation[]>();
  for (const relation of relations) {
    const fromBox = boxes.get(relation.fromElementId);
    const toBox = boxes.get(relation.toElementId);
    if (fromBox === undefined || toBox === undefined) {
      continue;
    }
    const key = pairKey(relation.fromElementId, relation.toElementId);
    const list = groups.get(key);
    if (list === undefined) {
      groups.set(key, [relation]);
    } else {
      list.push(relation);
    }
  }

  const routes = new Map<string, RelationRoute>();
  for (const group of groups.values()) {
    const orderedGroup = [...group].sort((left, right) =>
      left.relationId.localeCompare(right.relationId),
    );
    const firstBox = boxes.get(orderedGroup[0].fromElementId)!;
    const secondBox = boxes.get(orderedGroup[0].toElementId)!;
    const canonicalFrom =
      orderedGroup[0].fromElementId < orderedGroup[0].toElementId ? firstBox : secondBox;
    const canonicalTo =
      orderedGroup[0].fromElementId < orderedGroup[0].toElementId ? secondBox : firstBox;
    const canonicalDirection = unitVector(boxCenter(canonicalFrom), boxCenter(canonicalTo));
    const canonicalPerpendicular = {
      x: -canonicalDirection.y,
      y: canonicalDirection.x,
    };

    for (let index = 0; index < orderedGroup.length; index += 1) {
      const relation = orderedGroup[index];
      const fromBox = boxes.get(relation.fromElementId)!;
      const toBox = boxes.get(relation.toElementId)!;
      const previewAnchor = previewAnchors?.get(relation.relationId);
      const fromCenter = boxCenter(fromBox);
      const toCenter = boxCenter(toBox);
      const direction = unitVector(fromCenter, toCenter);
      const perpendicular = { x: -direction.y, y: direction.x };
      const calculatedFromBoundary = boundaryPoint(fromBox, toCenter);
      const calculatedToBoundary = boundaryPoint(toBox, fromCenter);
      const fromBoundary =
        previewAnchor?.side === "from" ? previewAnchor.boundary : calculatedFromBoundary;
      const toBoundary =
        previewAnchor?.side === "to" ? previewAnchor.boundary : calculatedToBoundary;
      const from =
        previewAnchor?.side === "from"
          ? previewAnchor.endpoint
          : relation.aggregationFrom === "none"
          ? fromBoundary
          : aggregationOuter(fromBoundary, direction, 1);
      const to =
        previewAnchor?.side === "to"
          ? previewAnchor.endpoint
          : relation.aggregationTo === "none"
          ? toBoundary
          : aggregationOuter(toBoundary, direction, -1);
      const offset =
        orderedGroup.length < 2
          ? 0
          : (index - (orderedGroup.length - 1) / 2) * 2 * BEND_STEP;
      const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      const lanePerpendicular = previewAnchor?.lanePerpendicular ?? canonicalPerpendicular;
      const control =
        offset === 0
          ? null
          : {
              x: mid.x + lanePerpendicular.x * offset,
              y: mid.y + lanePerpendicular.y * offset,
            };
      routes.set(relation.relationId, {
        relationId: relation.relationId,
        from,
        to,
        fromBoundary,
        toBoundary,
        direction,
        perpendicular,
        lanePerpendicular,
        control,
      });
    }
  }
  return routes;
};

const format = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};

export const relationPathData = (route: RelationRoute): string => {
  const start = `M ${format(route.from.x)} ${format(route.from.y)}`;
  if (route.control === null) {
    return `${start} L ${format(route.to.x)} ${format(route.to.y)}`;
  }
  return `${start} Q ${format(route.control.x)} ${format(route.control.y)} ${format(
    route.to.x,
  )} ${format(route.to.y)}`;
};

export const relationMidpoint = (route: RelationRoute): WorkspacePosition => {
  if (route.control === null) {
    return {
      x: (route.from.x + route.to.x) / 2,
      y: (route.from.y + route.to.y) / 2,
    };
  }
  return {
    x: 0.25 * route.from.x + 0.5 * route.control.x + 0.25 * route.to.x,
    y: 0.25 * route.from.y + 0.5 * route.control.y + 0.25 * route.to.y,
  };
};

export const multiplicityPosition = (
  side: "from" | "to",
  route: RelationRoute,
): WorkspacePosition => {
  const boundary = side === "from" ? route.fromBoundary : route.toBoundary;
  const outward = side === "from" ? 1 : -1;
  const lateral = side === "from" ? 1 : -1;
  return {
    x:
      boundary.x +
      route.direction.x * outward * MULTIPLICITY_OUT_GAP +
      route.perpendicular.x * lateral * MULTIPLICITY_SIDE_GAP,
    y:
      boundary.y +
      route.direction.y * outward * MULTIPLICITY_OUT_GAP +
      route.perpendicular.y * lateral * MULTIPLICITY_SIDE_GAP,
  };
};

export const diamondPoints = (
  side: "from" | "to",
  route: RelationRoute,
): string => {
  const boundary = side === "from" ? route.fromBoundary : route.toBoundary;
  const sign = side === "from" ? 1 : -1;
  const inner = { x: boundary.x, y: boundary.y };
  const outer = aggregationOuter(boundary, route.direction, sign);
  const sideA = {
    x:
      boundary.x +
      route.direction.x * sign * AGGREGATION_HALF +
      route.perpendicular.x * AGGREGATION_HALF,
    y:
      boundary.y +
      route.direction.y * sign * AGGREGATION_HALF +
      route.perpendicular.y * AGGREGATION_HALF,
  };
  const sideB = {
    x:
      boundary.x +
      route.direction.x * sign * AGGREGATION_HALF -
      route.perpendicular.x * AGGREGATION_HALF,
    y:
      boundary.y +
      route.direction.y * sign * AGGREGATION_HALF -
      route.perpendicular.y * AGGREGATION_HALF,
  };
  return `${inner.x},${inner.y} ${sideA.x},${sideA.y} ${outer.x},${outer.y} ${sideB.x},${sideB.y}`;
};
