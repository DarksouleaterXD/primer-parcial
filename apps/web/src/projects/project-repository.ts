import {
  createProjectSchema,
  deleteProjectSchema,
  projectListSchema,
  projectNotFoundSchema,
  projectRevisionConflictSchema,
  projectSnapshotSchema,
  renameProjectSchema,
  saveProjectDocumentSchema,
  type CreateProjectRequest,
  type DeleteProjectRequest,
  type ProjectList,
  type ProjectSnapshot,
  type RenameProjectRequest,
} from "@primer-parcial/contracts";
import {
  parseProjectDocument,
  serializeProjectDocument,
  type ProjectDocument,
} from "@primer-parcial/uml-domain";

const SESSION_TOKEN_KEY = "primer-parcial.session-token";

export type ProjectRepositoryError =
  | { readonly kind: "unauthenticated" }
  | { readonly kind: "invalid-request" }
  | { readonly kind: "not-found" }
  | { readonly kind: "conflict" }
  | { readonly kind: "unavailable" };

export type ProjectRepositoryResult<T> =
  | { readonly kind: "success"; readonly data: T }
  | { readonly kind: "error"; readonly error: ProjectRepositoryError };

export interface ProjectSaveRequest {
  readonly document: ProjectDocument;
  readonly expectedRevision: number;
}

export interface ProjectRepository {
  create(request: CreateProjectRequest): Promise<ProjectRepositoryResult<ProjectSnapshot>>;
  list(): Promise<ProjectRepositoryResult<ProjectList>>;
  get(projectId: string): Promise<ProjectRepositoryResult<ProjectSnapshot>>;
  reopenProject(projectId: string): Promise<ProjectRepositoryResult<ProjectSnapshot>>;
  rename(
    projectId: string,
    request: RenameProjectRequest,
  ): Promise<ProjectRepositoryResult<ProjectSnapshot>>;
  save(
    projectId: string,
    request: ProjectSaveRequest,
  ): Promise<ProjectRepositoryResult<ProjectSnapshot>>;
  delete(
    projectId: string,
    request: DeleteProjectRequest,
  ): Promise<ProjectRepositoryResult<undefined>>;
}

interface ProjectRepositoryOptions {
  readonly fetch?: typeof fetch;
  readonly storage?: Storage;
}

type RequestAttempt =
  | { readonly kind: "response"; readonly response: Response }
  | { readonly kind: "error"; readonly error: ProjectRepositoryError };

export function createProjectRepository(
  apiOrigin: string,
  {
    fetch: fetchImplementation = fetch,
    storage = window.sessionStorage,
  }: ProjectRepositoryOptions = {},
): ProjectRepository {
  const origin = apiOrigin.replace(/\/$/, "");

  const request = async (path: string, init: RequestInit = {}): Promise<RequestAttempt> => {
    const token = storage.getItem(SESSION_TOKEN_KEY);
    if (token === null) {
      return { kind: "error", error: { kind: "unauthenticated" } };
    }

    try {
      const response = await fetchImplementation(`${origin}${path}`, {
        ...init,
        headers: {
          ...init.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        storage.removeItem(SESSION_TOKEN_KEY);
        return { kind: "error", error: { kind: "unauthenticated" } };
      }

      return { kind: "response", response };
    } catch {
      return { kind: "error", error: { kind: "unavailable" } };
    }
  };

  const snapshotRequest = async (
    path: string,
    init: RequestInit,
    expectedStatus: number,
  ): Promise<ProjectRepositoryResult<ProjectSnapshot>> => {
    const attempt = await request(path, init);
    if (attempt.kind === "error") {
      return attempt;
    }
    if (attempt.response.status !== expectedStatus) {
      return classifyFailure(attempt.response);
    }

    const snapshot = await parseSnapshot(attempt.response);
    return snapshot === null
      ? { kind: "error", error: { kind: "unavailable" } }
      : { kind: "success", data: snapshot };
  };

  const getSnapshot = (projectId: string): Promise<ProjectRepositoryResult<ProjectSnapshot>> =>
    snapshotRequest(`/api/projects/${encodeURIComponent(projectId)}`, {}, 200);

  return {
    async create(input) {
      const parsed = createProjectSchema.safeParse(input);
      if (!parsed.success) {
        return { kind: "error", error: { kind: "invalid-request" } };
      }
      return snapshotRequest(
        "/api/projects",
        jsonRequest("POST", parsed.data),
        201,
      );
    },

    async list() {
      const attempt = await request("/api/projects");
      if (attempt.kind === "error") {
        return attempt;
      }
      if (attempt.response.status !== 200) {
        return classifyFailure(attempt.response);
      }

      const data = await parseJson(attempt.response, projectListSchema);
      return data === null
        ? { kind: "error", error: { kind: "unavailable" } }
        : { kind: "success", data };
    },

    get: getSnapshot,
    reopenProject: getSnapshot,

    async rename(projectId, input) {
      const parsed = renameProjectSchema.safeParse(input);
      if (!parsed.success) {
        return { kind: "error", error: { kind: "invalid-request" } };
      }
      return snapshotRequest(
        `/api/projects/${encodeURIComponent(projectId)}/name`,
        jsonRequest("PATCH", parsed.data),
        200,
      );
    },

    async save(projectId, input) {
      let serialized: string;
      try {
        serialized = serializeProjectDocument(parseProjectDocument(serializeProjectDocument(input.document)));
      } catch {
        return { kind: "error", error: { kind: "invalid-request" } };
      }

      const parsed = saveProjectDocumentSchema.safeParse({
        document: JSON.parse(serialized) as unknown,
        expectedRevision: input.expectedRevision,
      });
      if (!parsed.success) {
        return { kind: "error", error: { kind: "invalid-request" } };
      }

      return snapshotRequest(
        `/api/projects/${encodeURIComponent(projectId)}/document`,
        jsonRequest("PUT", parsed.data),
        200,
      );
    },

    async delete(projectId, input) {
      const parsed = deleteProjectSchema.safeParse(input);
      if (!parsed.success) {
        return { kind: "error", error: { kind: "invalid-request" } };
      }

      const attempt = await request(
        `/api/projects/${encodeURIComponent(projectId)}`,
        jsonRequest("DELETE", parsed.data),
      );
      if (attempt.kind === "error") {
        return attempt;
      }
      if (attempt.response.status !== 204) {
        return classifyFailure(attempt.response);
      }
      return { kind: "success", data: undefined };
    },
  };
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function classifyFailure<T>(response: Response): Promise<ProjectRepositoryResult<T>> {
  if (response.status === 400) {
    return { kind: "error", error: { kind: "invalid-request" } };
  }
  if (response.status === 404) {
    const body = await parseJson(response, projectNotFoundSchema);
    return body === null
      ? { kind: "error", error: { kind: "unavailable" } }
      : { kind: "error", error: { kind: "not-found" } };
  }
  if (response.status === 409) {
    const body = await parseJson(response, projectRevisionConflictSchema);
    return body === null
      ? { kind: "error", error: { kind: "unavailable" } }
      : { kind: "error", error: { kind: "conflict" } };
  }
  return { kind: "error", error: { kind: "unavailable" } };
}

async function parseSnapshot(response: Response): Promise<ProjectSnapshot | null> {
  const envelope = await parseJson(response, projectSnapshotSchema);
  if (envelope === null) {
    return null;
  }

  let document: ProjectDocument;
  try {
    document = parseProjectDocument(JSON.stringify(envelope.document));
  } catch {
    return null;
  }

  if (
    document.id !== envelope.id ||
    document.name !== envelope.name ||
    document.revision !== envelope.revision ||
    document.createdAt !== envelope.createdAt ||
    document.updatedAt !== envelope.updatedAt
  ) {
    return null;
  }

  return { ...envelope, document };
}

async function parseJson<T>(
  response: Response,
  schema: { safeParse(input: unknown): { success: true; data: T } | { success: false } },
): Promise<T | null> {
  try {
    const result = schema.safeParse(await response.json());
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
