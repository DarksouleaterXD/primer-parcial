import type { ProjectDocument } from "@primer-parcial/uml-domain";
import { z } from "zod";

export const MAX_PASSWORD_BYTES = 72;

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

export const emailSchema = z.string().transform(normalizeEmail).pipe(z.email());

export const passwordSchema = z
  .string()
  .min(8)
  .refine(
    (password) => new TextEncoder().encode(password).byteLength <= MAX_PASSWORD_BYTES,
    `Password must not exceed ${MAX_PASSWORD_BYTES} UTF-8 bytes`,
  );

export const accountNameSchema = z.string().trim().min(1);

export const registerSchema = z
  .object({
    firstName: accountNameSchema,
    lastName: accountNameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const accountSchema = z.object({
  id: z.uuid(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.email(),
});

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
});

export type RegisterCredentials = z.infer<typeof registerSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Session = z.infer<typeof sessionSchema>;

export const projectNameSchema = z.string().trim().min(1);
export const projectRevisionSchema = z.number().int().nonnegative();

export const createProjectSchema = z
  .object({
    name: projectNameSchema,
  })
  .strict();

export const renameProjectSchema = z
  .object({
    name: projectNameSchema,
    expectedRevision: projectRevisionSchema,
  })
  .strict();

export const saveProjectDocumentSchema = z
  .object({
    document: z.unknown(),
    expectedRevision: projectRevisionSchema,
  })
  .strict();

export const deleteProjectSchema = z
  .object({
    expectedRevision: projectRevisionSchema,
  })
  .strict();

export const projectSummarySchema = z
  .object({
    id: z.uuid(),
    name: projectNameSchema,
    revision: projectRevisionSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export const projectListSchema = z
  .object({
    projects: z.array(projectSummarySchema),
  })
  .strict();

export const projectSnapshotSchema = z
  .object({
    id: z.uuid(),
    name: projectNameSchema,
    revision: projectRevisionSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    document: z.unknown(),
  })
  .strict();

export const projectNotFoundSchema = z
  .object({ code: z.literal("PROJECT_NOT_FOUND") })
  .strict();
export const projectRevisionConflictSchema = z
  .object({ code: z.literal("PROJECT_REVISION_CONFLICT") })
  .strict();
export const projectDocumentInvalidSchema = z
  .object({ code: z.literal("PROJECT_DOCUMENT_INVALID") })
  .strict();
export const projectStorageUnavailableSchema = z
  .object({ code: z.literal("PROJECT_STORAGE_UNAVAILABLE") })
  .strict();

export type CreateProjectRequest = z.infer<typeof createProjectSchema>;
export type RenameProjectRequest = z.infer<typeof renameProjectSchema>;
export type SaveProjectDocumentRequest = Omit<
  z.infer<typeof saveProjectDocumentSchema>,
  "document"
> & { readonly document: unknown };
export type DeleteProjectRequest = z.infer<typeof deleteProjectSchema>;
export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type ProjectList = z.infer<typeof projectListSchema>;
type ProjectSnapshotEnvelope = z.infer<typeof projectSnapshotSchema>;
export type ProjectSnapshot = Omit<ProjectSnapshotEnvelope, "document"> & {
  readonly document: ProjectDocument;
};
export type ProjectNotFound = z.infer<typeof projectNotFoundSchema>;
export type ProjectRevisionConflict = z.infer<typeof projectRevisionConflictSchema>;
export type ProjectDocumentInvalid = z.infer<typeof projectDocumentInvalidSchema>;
export type ProjectStorageUnavailable = z.infer<typeof projectStorageUnavailableSchema>;

export type HealthStatus = "available" | "unavailable";

export interface HealthResponse {
  status: HealthStatus;
}
