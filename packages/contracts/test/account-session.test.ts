import {
  MAX_PASSWORD_BYTES,
  credentialsSchema,
  normalizeEmail,
} from "../src/index.js";
import { describe, expect, it } from "vitest";

describe("account session contracts", () => {
  it("normalizes email before validating credentials", () => {
    expect(normalizeEmail("  PERSONA@EXAMPLE.TEST ")).toBe("persona@example.test");
    expect(
      credentialsSchema.parse({
        email: "  PERSONA@EXAMPLE.TEST ",
        password: "password",
      }),
    ).toEqual({ email: "persona@example.test", password: "password" });
  });

  it("requires passwords between eight characters and 72 UTF-8 bytes", () => {
    expect(
      credentialsSchema.safeParse({ email: "persona@example.test", password: "short" }).success,
    ).toBe(false);
    expect(
      credentialsSchema.safeParse({
        email: "persona@example.test",
        password: "a".repeat(MAX_PASSWORD_BYTES + 1),
      }).success,
    ).toBe(false);
    expect(
      credentialsSchema.safeParse({
        email: "persona@example.test",
        password: "a".repeat(70) + "é".repeat(2),
      }).success,
    ).toBe(false);
  });
});
