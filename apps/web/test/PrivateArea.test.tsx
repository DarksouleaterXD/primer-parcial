import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PrivateArea } from "../src/components/PrivateArea";

const apiOrigin = "http://api.example.test";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("PrivateArea", () => {
  it("renders no private content until a stored JWT confirms the session", async () => {
    window.sessionStorage.setItem("primer-parcial.session-token", "jwt-token");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        id: "32874025-f1b8-4650-8b9f-e59ff4b72175",
        firstName: "Persona",
        lastName: "Ejemplo",
        email: "persona@example.test",
      }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PrivateArea apiOrigin={apiOrigin} />);

    expect(screen.getByText("Comprobando sesión…")).toBeTruthy();
    expect(await screen.findByText("Área privada")).toBeTruthy();
    expect(screen.getByText("Persona Ejemplo")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(`${apiOrigin}/api/auth/session`, {
      headers: { Authorization: "Bearer jwt-token" },
    });
  });

  it("redirects an anonymous visitor without requesting a private resource", async () => {
    const navigate = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<PrivateArea apiOrigin={apiOrigin} onNavigate={navigate} />);

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith("/login"));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Área privada")).toBeNull();
  });

  it("clears an invalid token and redirects to login", async () => {
    window.sessionStorage.setItem("primer-parcial.session-token", "invalid-token");
    const navigate = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    render(<PrivateArea apiOrigin={apiOrigin} onNavigate={navigate} />);

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith("/login"));
    expect(window.sessionStorage.getItem("primer-parcial.session-token")).toBeNull();
  });

  it("represents a failed protected request without displaying private content", async () => {
    window.sessionStorage.setItem("primer-parcial.session-token", "jwt-token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    render(<PrivateArea apiOrigin={apiOrigin} />);

    expect(await screen.findByText("No pudimos confirmar tu sesión")).toBeTruthy();
    expect(screen.queryByText("Área privada")).toBeNull();
  });

  it("clears sessionStorage and redirects locally on logout without another request", async () => {
    window.sessionStorage.setItem("primer-parcial.session-token", "jwt-token");
    const navigate = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        id: "32874025-f1b8-4650-8b9f-e59ff4b72175",
        firstName: null,
        lastName: null,
        email: "legacy@example.test",
      }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PrivateArea apiOrigin={apiOrigin} onNavigate={navigate} />);

    expect(await screen.findByText("legacy@example.test")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Cerrar sesión" }));

    expect(window.sessionStorage.getItem("primer-parcial.session-token")).toBeNull();
    expect(navigate).toHaveBeenCalledWith("/");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
