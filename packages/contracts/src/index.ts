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

export const credentialsSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const accountSchema = z.object({
  id: z.uuid(),
  email: z.email(),
});

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
});

export type Credentials = z.infer<typeof credentialsSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Session = z.infer<typeof sessionSchema>;

export type HealthStatus = "available" | "unavailable";

export interface HealthResponse {
  status: HealthStatus;
}
