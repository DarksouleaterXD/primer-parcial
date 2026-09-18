import type {
  ProjectDocument,
  UmlElementId,
  UmlEnumeration,
  UmlPackage,
} from "@primer-parcial/uml-domain";

import type { WorkspacePosition } from "./workspace-controller";

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 90;
export const SVG_MARGIN = 40;
export const KEYBOARD_MOVE_DELTA = 10;

export interface ProjectedNode {
  readonly elementId: UmlElementId;
  readonly kind: "package" | "class" | "enumeration";
  readonly name: string;
  readonly position: WorkspacePosition;
}

export type AggregationKind = "none" | "shared" | "composite";

export interface ProjectedRelation {
  readonly relationId: UmlElementId;
  readonly kind: "association" | "generalization";
  readonly fromElementId: UmlElementId;
  readonly toElementId: UmlElementId;
  readonly from: WorkspacePosition;
  readonly to: WorkspacePosition;
  readonly label?: string;
  readonly multiplicityFrom?: string;
  readonly multiplicityTo?: string;
  readonly aggregationFrom: AggregationKind;
  readonly aggregationTo: AggregationKind;
}

export interface WorkspaceProjection {
  readonly nodes: readonly ProjectedNode[];
  readonly relations: readonly ProjectedRelation[];
  readonly diagrammableCount: number;
}

export interface ResolveWorkspacePosition {
  (elementId: string): WorkspacePosition | null;
}

const isDiagrammableElementId = (
  document: ProjectDocument,
  elementId: string,
): boolean =>
  document.uml.packages.some(({ id }) => id === elementId) ||
  document.uml.classes.some(({ id }) => id === elementId) ||
  document.uml.enumerations.some(({ id }) => id === elementId);

const multiplicityLabel = (multiplicity: {
  lower: number;
  upper: number | "*";
}): string => `${multiplicity.lower}..${multiplicity.upper}`;

export const projectWorkspace = (
  document: ProjectDocument,
  resolvePosition: ResolveWorkspacePosition,
): WorkspaceProjection => {
  const nodes: ProjectedNode[] = [
    ...document.uml.packages.map((item: UmlPackage) => ({
      elementId: item.id,
      kind: "package" as const,
      name: item.name,
      position: resolvePosition(item.id),
    })),
    ...document.uml.classes.map((item) => ({
      elementId: item.id,
      kind: "class" as const,
      name: item.name,
      position: resolvePosition(item.id),
    })),
    ...document.uml.enumerations.map((item: UmlEnumeration) => ({
      elementId: item.id,
      kind: "enumeration" as const,
      name: item.name,
      position: resolvePosition(item.id),
    })),
  ].filter(
    (node): node is ProjectedNode => node.position !== null && node.position !== undefined,
  );

  const relationEnds = (
    elementId: string,
  ): { resolved: WorkspacePosition | null; visible: boolean } => {
    if (!isDiagrammableElementId(document, elementId)) {
      return { resolved: null, visible: false };
    }
    return { resolved: resolvePosition(elementId), visible: true };
  };

  const associations: ProjectedRelation[] = document.uml.associations.flatMap(
    (association) => {
      if (association.ends.length !== 2) {
        return [];
      }
      const [first, second] = association.ends;
      const fromEnd = relationEnds(first.classifierId);
      const toEnd = relationEnds(second.classifierId);
      if (!fromEnd.visible || !toEnd.visible) {
        return [];
      }
      const from = fromEnd.resolved;
      const to = toEnd.resolved;
      if (from === null || to === null) {
        return [];
      }
      return [
        {
          relationId: association.id,
          kind: "association" as const,
          fromElementId: first.classifierId,
          toElementId: second.classifierId,
          from,
          to,
          label: association.name,
          multiplicityFrom: multiplicityLabel(first.multiplicity),
          multiplicityTo: multiplicityLabel(second.multiplicity),
          aggregationFrom: first.aggregation,
          aggregationTo: second.aggregation,
        },
      ];
    },
  );

  const generalizations: ProjectedRelation[] = document.uml.generalizations.flatMap(
    (generalization) => {
      const fromEnd = relationEnds(generalization.specificId);
      const toEnd = relationEnds(generalization.generalId);
      if (!fromEnd.visible || !toEnd.visible) {
        return [];
      }
      const from = fromEnd.resolved;
      const to = toEnd.resolved;
      if (from === null || to === null) {
        return [];
      }
      return [
        {
          relationId: generalization.id,
          kind: "generalization" as const,
          fromElementId: generalization.specificId,
          toElementId: generalization.generalId,
          from,
          to,
          aggregationFrom: "none",
          aggregationTo: "none",
        },
      ];
    },
  );

  return {
    nodes,
    relations: [...associations, ...generalizations],
    diagrammableCount: nodes.length,
  };
};