import {
  MAX_PASSWORD_BYTES,
  loginSchema,
  normalizeEmail,
  registerSchema,
} from "../src/index.js";
import { describe, expect, it } from "vitest";

describe("account session contracts", () => {
  it("normalizes email and names before validating registration", () => {
    expect(normalizeEmail("  PERSONA@EXAMPLE.TEST ")).toBe("persona@example.test");
    expect(
      registerSchema.parse({
        firstName: "  Persona ",
        lastName: " Ejemplo  ",
        email: "  PERSONA@EXAMPLE.TEST ",
        password: "password",
      }),
    ).toEqual({
      firstName: "Persona",
      lastName: "Ejemplo",
      email: "persona@example.test",
      password: "password",
    });
  });

  it("requires non-empty names and passwords between eight characters and 72 UTF-8 bytes", () => {
    expect(
      registerSchema.safeParse({
        firstName: "Persona",
        lastName: "Ejemplo",
        email: "persona@example.test",
        password: "short",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        firstName: "Persona",
        lastName: "Ejemplo",
        email: "persona@example.test",
        password: "a".repeat(MAX_PASSWORD_BYTES + 1),
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        firstName: "Persona",
        lastName: "Ejemplo",
        email: "persona@example.test",
        password: "a".repeat(70) + "é".repeat(2),
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        firstName: "   ",
        lastName: "Ejemplo",
        email: "persona@example.test",
        password: "password",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        firstName: "Persona",
        lastName: "   ",
        email: "persona@example.test",
        password: "password",
      }).success,
    ).toBe(false);
  });

  it("keeps login limited to email and password", () => {
    expect(
      loginSchema.parse({ email: " PERSONA@EXAMPLE.TEST ", password: "password" }),
    ).toEqual({ email: "persona@example.test", password: "password" });
    expect(
      loginSchema.safeParse({
        firstName: "Persona",
        email: "persona@example.test",
        password: "password",
      }).success,
    ).toBe(false);
  });
});
