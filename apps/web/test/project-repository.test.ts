import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProjectSnapshot } from "@primer-parcial/contracts";
import { createProjectDocument, type ProjectDocument } from "@primer-parcial/uml-domain";

import { createProjectRepository } from "../src/projects/project-repository";

const apiOrigin = "http://api.example.test";
const projectId = "10000000-0000-4000-8000-000000000001";
const ownerId = "10000000-0000-4000-8000-000000000002";
const createdAt = "2026-09-18T01:00:00.000Z";

const documentAt = (
  name = "Proyecto UML",
  revision = 0,
  updatedAt = createdAt,
): ProjectDocument => {
  const base = createProjectDocument({
    name,
    ownerId,
    idFactory: () => projectId,
    clock: () => new Date(createdAt),
  });
  return { ...base, revision, updatedAt };
};

const snapshotOf = (document: ProjectDocument): ProjectSnapshot => ({
  id: document.id,
  name: document.name,
  revision: document.revision,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
  document,
});

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

afterEach(() => {
  window.sessionStorage.clear();
});

describe("project repository", () => {
  it("uses only the API with the existing Bearer session for the complete approved lifecycle", async () => {
    window.sessionStorage.setItem("primer-parcial.session-token", "jwt-token");
    const initial = snapshotOf(documentAt());
    const renamed = snapshotOf(documentAt("Proyecto Renombrado", 1, "2026-09-18T01:01:00.000Z"));
    const saved = snapshotOf(documentAt("Proyecto Renombrado", 2, "2026-09-18T01:02:00.000Z"));
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(jsonResponse(initial, 201))
      .mockResolvedValueOnce(jsonResponse({ projects: [{
        id: initial.id,
        name: initial.name,
        revision: initial.revision,
        createdAt: initial.createdAt,
        updatedAt: initial.updatedAt,
      }] }, 200))
      .mockResolvedValueOnce(jsonResponse(initial, 200))
      .mockResolvedValueOnce(jsonResponse(initial, 200))
      .mockResolvedValueOnce(jsonResponse(renamed, 200))
      .mockResolvedValueOnce(jsonResponse(saved, 200))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const repository = createProjectRepository(apiOrigin, {
      fetch: fetchMock as typeof fetch,
      storage: window.sessionStorage,
    });

    expect(await repository.create({ name: "  Proyecto UML  " })).toEqual({ kind: "success", data: initial });
    expect((await repository.list()).kind).toBe("success");
    expect((await repository.get(projectId)).kind).toBe("success");
    expect((await repository.reopenProject(projectId)).kind).toBe("success");
    expect(await repository.rename(projectId, { name: " Proyecto Renombrado ", expectedRevision: 0 }))
      .toEqual({ kind: "success", data: renamed });
    expect(await repository.save(projectId, { document: renamed.document, expectedRevision: 1 }))
      .toEqual({ kind: "success", data: saved });
    expect(await repository.delete(projectId, { expectedRevision: 2 }))
      .toEqual({ kind: "success", data: undefined });

    expect(fetchMock).toHaveBeenCalledTimes(7);
    expect(fetchMock.mock.calls[0]).toEqual([
      `${apiOrigin}/api/projects`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer jwt-token" },
        body: JSON.stringify({ name: "Proyecto UML" }),
      },
    ]);
    expect(fetchMock.mock.calls[1][0]).toBe(`${apiOrigin}/api/projects`);
    expect(fetchMock.mock.calls[2][0]).toBe(`${apiOrigin}/api/projects/${projectId}`);
    expect(fetchMock.mock.calls[3][0]).toBe(`${apiOrigin}/api/projects/${projectId}`);
    expect(fetchMock.mock.calls[4]).toEqual([
      `${apiOrigin}/api/projects/${projectId}/name`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer jwt-token" },
        body: JSON.stringify({ name: "Proyecto Renombrado", expectedRevision: 0 }),
      },
    ]);
    expect(fetchMock.mock.calls[5][0]).toBe(`${apiOrigin}/api/projects/${projectId}/document`);
    expect(fetchMock.mock.calls[5][1]).toMatchObject({
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer jwt-token" },
    });
    expect(fetchMock.mock.calls[6]).toEqual([
      `${apiOrigin}/api/projects/${projectId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: "Bearer jwt-token" },
        body: JSON.stringify({ expectedRevision: 2 }),
      },
    ]);
  });

  it("classifies 401, 400, 404 and 409 as typed outcomes without leaking response internals", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 400 }))
      .mockResolvedValueOnce(jsonResponse({ code: "PROJECT_NOT_FOUND" }, 404))
      .mockResolvedValueOnce(jsonResponse({ code: "PROJECT_REVISION_CONFLICT" }, 409));
    const repository = createProjectRepository(apiOrigin, {
      fetch: fetchMock as typeof fetch,
      storage: window.sessionStorage,
    });

    window.sessionStorage.setItem("primer-parcial.session-token", "jwt-token");
    expect(await repository.get(projectId)).toEqual({ kind: "error", error: { kind: "unauthenticated" } });
    expect(window.sessionStorage.getItem("primer-parcial.session-token")).toBeNull();

    window.sessionStorage.setItem("primer-parcial.session-token", "jwt-token");
    expect(await repository.rename(projectId, { name: "Nombre", expectedRevision: 0 }))
      .toEqual({ kind: "error", error: { kind: "invalid-request" } });
    expect(await repository.get(projectId)).toEqual({ kind: "error", error: { kind: "not-found" } });
    expect(await repository.rename(projectId, { name: "Nombre", expectedRevision: 0 }))
      .toEqual({ kind: "error", error: { kind: "conflict" } });
  });

  it("does not issue project traffic without a session and rejects invalid local envelopes before fetch", async () => {
    const fetchMock = vi.fn();
    const repository = createProjectRepository(apiOrigin, {
      fetch: fetchMock as typeof fetch,
      storage: window.sessionStorage,
    });

    expect(await repository.list()).toEqual({ kind: "error", error: { kind: "unauthenticated" } });
    window.sessionStorage.setItem("primer-parcial.session-token", "jwt-token");
    expect(await repository.create({ name: "   " })).toEqual({
      kind: "error",
      error: { kind: "invalid-request" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed or metadata-divergent success envelopes instead of constructing a project", async () => {
    window.sessionStorage.setItem("primer-parcial.session-token", "jwt-token");
    const document = documentAt();
    const divergent = { ...snapshotOf(document), revision: 9 };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(divergent, 200))
      .mockResolvedValueOnce(jsonResponse({ id: projectId }, 200));
    const repository = createProjectRepository(apiOrigin, {
      fetch: fetchMock as typeof fetch,
      storage: window.sessionStorage,
    });

    expect(await repository.get(projectId)).toEqual({ kind: "error", error: { kind: "unavailable" } });
    expect(await repository.get(projectId)).toEqual({ kind: "error", error: { kind: "unavailable" } });
  });

  it("maps network failures to unavailable without exposing the transport error", async () => {
    window.sessionStorage.setItem("primer-parcial.session-token", "jwt-token");
    const repository = createProjectRepository(apiOrigin, {
      fetch: vi.fn().mockRejectedValue(new Error("socket detail")) as typeof fetch,
      storage: window.sessionStorage,
    });

    expect(await repository.get(projectId)).toEqual({ kind: "error", error: { kind: "unavailable" } });
  });
});
