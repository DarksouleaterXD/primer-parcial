import { describe, expect, it } from "vitest";

import {
  createProjectDocument,
  multiplicity,
  type ProjectDocument,
} from "@primer-parcial/uml-domain";

import { projectWorkspace } from "../src/uml-workspace/projection";

describe("projectWorkspace", () => {
  it("projects no nodes or relations for an empty document without mutating it", () => {
    const document = createProjectDocument({
      name: "Empty",
      ownerId: "owner",
      idFactory: () => "doc-1",
    });
    const before = JSON.stringify(document);

    const projection = projectWorkspace(document, () => null);

    expect(projection.nodes).toEqual([]);
    expect(projection.relations).toEqual([]);
    expect(projection.diagrammableCount).toBe(0);
    expect(JSON.stringify(document)).toBe(before);
  });

  it("omits an association whose endpoint references a missing diagrammable element", () => {
    const document = createProjectDocument({
      name: "Orphan",
      ownerId: "owner",
      idFactory: () => "doc-2",
    });
    const fixture = {
      ...document,
      uml: {
        ...document.uml,
        associations: [
          {
            kind: "association" as const,
            id: "assoc-1",
            name: "orphan",
            ends: [
              {
                kind: "association-end" as const,
                id: "end-a",
                classifierId: "missing-a",
                multiplicity: multiplicity(1, 1),
                aggregation: "none" as const,
              },
              {
                kind: "association-end" as const,
                id: "end-b",
                classifierId: "missing-b",
                multiplicity: multiplicity(1, 1),
                aggregation: "none" as const,
              },
            ],
          },
        ],
      },
    } as ProjectDocument;

    const projection = projectWorkspace(fixture, () => null);

    expect(projection.relations).toEqual([]);
    expect(projection.nodes).toEqual([]);
  });

  it("projects new packages in deterministic diagram order", () => {
    const document = createProjectDocument({
      name: "Packages",
      ownerId: "owner",
      idFactory: () => "doc-3",
    });
    const fixture = {
      ...document,
      uml: {
        ...document.uml,
        packages: [
          { kind: "package" as const, id: "pkg-a", name: "A" },
          { kind: "package" as const, id: "pkg-b", name: "B" },
        ],
      },
    } as ProjectDocument;

    const projection = projectWorkspace(fixture, (elementId) =>
      elementId === "pkg-a" ? { x: 80, y: 80 } : { x: 320, y: 80 },
    );

    expect(projection.nodes.map((node) => node.elementId)).toEqual(["pkg-a", "pkg-b"]);
    expect(projection.nodes[1].position).toEqual({ x: 320, y: 80 });
  });
});