import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAuthClient, validateCredentials } from "../src/auth/auth-client";

const apiOrigin = "http://api.example.test";

describe("authentication client", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("uses the shared credentials rules, including UTF-8 byte length", () => {
    expect(validateCredentials({ email: " PERSONA@EXAMPLE.TEST ", password: "password" })).toEqual({
      data: { email: "persona@example.test", password: "password" },
    });
    expect(validateCredentials({ email: "invalid", password: "password" })).toHaveProperty("error");
    expect(validateCredentials({ email: "persona@example.test", password: "short" })).toHaveProperty(
      "error",
    );
    expect(
      validateCredentials({
        email: "persona@example.test",
        password: "a".repeat(70) + "é".repeat(2),
      }),
    ).toHaveProperty("error");
  });

  it("registers with the typed contract and returns the public API error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "32874025-f1b8-4650-8b9f-e59ff4b72175", email: "persona@example.test" }), {
          status: 201,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unable to register account" }), { status: 400 }),
      );
    const client = createAuthClient(apiOrigin, { fetch: fetchMock });
    const credentials = { email: "persona@example.test", password: "password" };

    await expect(client.register(credentials)).resolves.toEqual({
      data: { id: "32874025-f1b8-4650-8b9f-e59ff4b72175", email: "persona@example.test" },
    });
    await expect(client.register(credentials)).resolves.toEqual({
      error: "Unable to register account",
    });
    expect(fetchMock).toHaveBeenCalledWith(`${apiOrigin}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
  });

  it("stores only the JWT in sessionStorage after a successful login", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "jwt-token" }), { status: 200 }),
    );
    const client = createAuthClient(apiOrigin, { fetch: fetchMock });

    await expect(
      client.login({ email: "persona@example.test", password: "password" }),
    ).resolves.toEqual({ data: undefined });

    expect(window.sessionStorage.getItem("primer-parcial.session-token")).toBe("jwt-token");
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.getItem("password")).toBeNull();
  });

  it("sends the stored JWT to confirm a current session", async () => {
    window.sessionStorage.setItem("primer-parcial.session-token", "jwt-token");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "32874025-f1b8-4650-8b9f-e59ff4b72175", email: "persona@example.test" }), {
        status: 200,
      }),
    );
    const client = createAuthClient(apiOrigin, { fetch: fetchMock });

    await expect(client.currentAccount()).resolves.toEqual({
      data: { id: "32874025-f1b8-4650-8b9f-e59ff4b72175", email: "persona@example.test" },
    });
    expect(fetchMock).toHaveBeenCalledWith(`${apiOrigin}/api/auth/session`, {
      headers: { Authorization: "Bearer jwt-token" },
    });
  });

  it("clears an invalid session and logout does not call the backend", async () => {
    window.sessionStorage.setItem("primer-parcial.session-token", "invalid-token");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    const client = createAuthClient(apiOrigin, { fetch: fetchMock });

    await expect(client.currentAccount()).resolves.toEqual({ data: null });
    expect(client.hasSession()).toBe(false);

    window.sessionStorage.setItem("primer-parcial.session-token", "jwt-token");
    client.logout();
    expect(client.hasSession()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
