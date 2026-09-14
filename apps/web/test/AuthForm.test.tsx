import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "../src/components/AuthForm";

const apiOrigin = "http://api.example.test";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("AuthForm", () => {
  it("labels registration fields and focuses a shared-contract validation error", async () => {
    render(<AuthForm apiOrigin={apiOrigin} mode="register" />);

    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Contraseña")).toBeTruthy();
    fireEvent.input(screen.getByLabelText("Email"), { target: { value: "invalid" } });
    fireEvent.input(screen.getByLabelText("Contraseña"), { target: { value: "short" } });
    fireEvent.submit(screen.getByRole("form", { name: "Crear cuenta" }));

    const error = await screen.findByRole("alert");
    expect(error.textContent).toContain("email válido");
    expect(document.activeElement).toBe(error);
  });

  it("shows a public backend error after registration", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Unable to register account" }), { status: 400 }),
      ),
    );
    render(<AuthForm apiOrigin={apiOrigin} mode="register" />);

    fireEvent.input(screen.getByLabelText("Email"), { target: { value: "persona@example.test" } });
    fireEvent.input(screen.getByLabelText("Contraseña"), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("form", { name: "Crear cuenta" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Unable to register account");
  });

  it("redirects to the private route only after a successful login", async () => {
    const navigate = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ accessToken: "jwt-token" }), { status: 200 }),
      ),
    );
    render(<AuthForm apiOrigin={apiOrigin} mode="login" onNavigate={navigate} />);

    fireEvent.input(screen.getByLabelText("Email"), { target: { value: "persona@example.test" } });
    fireEvent.input(screen.getByLabelText("Contraseña"), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("form", { name: "Iniciar sesión" }));

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith("/workspace"));
    expect(window.sessionStorage.getItem("primer-parcial.session-token")).toBe("jwt-token");
  });
});
