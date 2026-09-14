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

export type HealthStatus = "available" | "unavailable";

export interface HealthResponse {
  status: HealthStatus;
}
