import { describe, expect, it } from "vitest";

import {
  createRelationsFixtureDocument,
  createWorkspaceSessionFromDocument,
  FIXTURE_IDS,
} from "../src/uml-workspace/workspace-fixture";
import { projectWorkspace } from "../src/uml-workspace/projection";
import {
  computeRelationRoutes,
  diamondPoints,
  multiplicityPosition,
  relationPathData,
  relationMidpoint,
  type RelationRoute,
} from "../src/uml-workspace/relation-routing";

const routesForFixture = () => {
  const session = createWorkspaceSessionFromDocument(createRelationsFixtureDocument());
  const projection = projectWorkspace(session.state.currentDocument, session.resolvePosition);
  const boxes = new Map(
    projection.nodes.map((node) => [
      node.elementId,
      { kind: node.kind, position: node.position },
    ]),
  );
  return { projection, routes: computeRelationRoutes(projection.relations, boxes) };
};

const routeList = (routes: ReadonlyMap<string, RelationRoute>) =>
  Array.from(routes.values());

describe("relation-routing", () => {
  it("routes all three fixture relations with three distinct geometries", () => {
    const { projection, routes } = routesForFixture();

    expect(routes.size).toBe(3);
    expect(routeList(routes).filter((route) => route.control === null).length).toBe(1);
    expect(routeList(routes).filter((route) => route.control !== null).length).toBe(2);

    const ds = projection.relations.map((relation) =>
      relationPathData(routes.get(relation.relationId)!),
    );
    expect(new Set(ds).size).toBe(3);
    expect(ds).not.toContain("M 190 305 L 670 105");
  });

  it("bends the relations that share a node pair and keeps defines straight", () => {
    const { routes } = routesForFixture();

    expect(routes.get(FIXTURE_IDS.definesRoleAssociation)!.control).toBeNull();
    expect(routes.get(FIXTURE_IDS.managesAssociation)!.control).not.toBeNull();
    expect(routes.get(FIXTURE_IDS.generalization)!.control).not.toBeNull();
    expect(routes.get(FIXTURE_IDS.managesAssociation)!.control).not.toEqual(
      routes.get(FIXTURE_IDS.generalization)!.control,
    );
  });

  it("extends the aggregation diamond beyond the shared-end boundary and keeps the generalization coincident", () => {
    const { routes } = routesForFixture();

    const manages = routes.get(FIXTURE_IDS.managesAssociation)!;
    const defines = routes.get(FIXTURE_IDS.definesRoleAssociation)!;
    const generalization = routes.get(FIXTURE_IDS.generalization)!;

    expect(manages.from).not.toEqual(manages.fromBoundary);
    expect(manages.toBoundary).toEqual(generalization.fromBoundary);
    expect(manages.fromBoundary).toEqual(generalization.toBoundary);
    expect(defines.from).not.toEqual(defines.fromBoundary);
    expect(generalization.from).toEqual(generalization.fromBoundary);
  });

  it("reaches the defines association straight from the User bottom edge to the Role top edge", () => {
    const { routes } = routesForFixture();

    const defines = routes.get(FIXTURE_IDS.definesRoleAssociation)!;
    expect(defines.control).toBeNull();
    expect(defines.fromBoundary.x).toBeCloseTo(673.6, 1);
    expect(defines.fromBoundary.y).toBeCloseTo(150, 1);
    expect(defines.toBoundary.x).toBeCloseTo(687.2, 1);
    expect(defines.toBoundary.y).toBeCloseTo(320, 1);

    const mid = relationMidpoint(defines);
    expect(mid.x).toBeCloseTo((defines.from.x + defines.to.x) / 2, 5);
    expect(mid.y).toBeCloseTo((defines.from.y + defines.to.y) / 2, 5);
  });

  it("places multiplicity labels out of the nodes and near their own boundary", () => {
    const { routes } = routesForFixture();

    const defines = routes.get(FIXTURE_IDS.definesRoleAssociation)!;
    const fromMultiplicity = multiplicityPosition("from", defines);
    const toMultiplicity = multiplicityPosition("to", defines);

    expect(fromMultiplicity.y).toBeGreaterThan(defines.fromBoundary.y);
    expect(toMultiplicity.y).toBeLessThan(defines.toBoundary.y);
    expect(fromMultiplicity.x).toBeGreaterThan(defines.fromBoundary.x - 20);
    expect(toMultiplicity.x).toBeGreaterThan(defines.toBoundary.x - 20);
  });

  it("builds the composite diamond on the from boundary aligned with the route", () => {
    const { routes } = routesForFixture();

    const defines = routes.get(FIXTURE_IDS.definesRoleAssociation)!;
    const marker = diamondPoints("from", defines);
    const parts = marker.split(" ").map((part) => part.split(",").map(Number));

    expect(parts).toHaveLength(4);
    expect(parts[0][0]).toBeCloseTo(defines.fromBoundary.x, 1);
    expect(parts[0][1]).toBeCloseTo(defines.fromBoundary.y, 1);
    expect(parts[2][0]).toBeCloseTo(defines.from.x, 1);
    expect(parts[2][1]).toBeCloseTo(defines.from.y, 1);
    const rounded = parts
      .map((part) => part.map((value) => Math.round(value * 100) / 100).join(","))
      .join(" ");
    expect(rounded).toBe("673.6,150 669.01,155.38 674.4,159.97 678.98,154.59");
  });

  it("produces deterministic routes across repeated computation", () => {
    const first = routesForFixture();
    const second = routesForFixture();

    const firstPaths = first.projection.relations.map((relation) =>
      relationPathData(first.routes.get(relation.relationId)!),
    );
    const secondPaths = second.projection.relations.map((relation) =>
      relationPathData(second.routes.get(relation.relationId)!),
    );
    expect(secondPaths).toEqual(firstPaths);
  });

  it("assigns parallel lanes by relation ID instead of each relation direction", () => {
    const { projection } = routesForFixture();
    const boxes = new Map(
      projection.nodes.map((node) => [
        node.elementId,
        { kind: node.kind, position: node.position },
      ]),
    );
    const reversed = computeRelationRoutes([...projection.relations].reverse(), boxes);
    const normal = computeRelationRoutes(projection.relations, boxes);

    expect(reversed.get(FIXTURE_IDS.managesAssociation)?.control).toEqual(
      normal.get(FIXTURE_IDS.managesAssociation)?.control,
    );
    expect(reversed.get(FIXTURE_IDS.generalization)?.control).toEqual(
      normal.get(FIXTURE_IDS.generalization)?.control,
    );
  });
});
