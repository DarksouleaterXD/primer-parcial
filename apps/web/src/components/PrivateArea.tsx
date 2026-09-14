import { useEffect, useState } from "preact/hooks";

import { createAuthClient } from "../auth/auth-client";
import type { Account } from "@primer-parcial/contracts";

interface PrivateAreaProps {
  readonly apiOrigin: string;
  readonly onNavigate?: (path: string) => void;
}

type PrivateState =
  | { readonly status: "checking" }
  | { readonly status: "unauthenticated" }
  | { readonly status: "unavailable"; readonly message: string }
  | { readonly status: "authorized"; readonly account: Account };

export function PrivateArea({ apiOrigin, onNavigate = navigate }: PrivateAreaProps) {
  const [state, setState] = useState<PrivateState>({ status: "checking" });

  useEffect(() => {
    let active = true;
    const client = createAuthClient(apiOrigin);

    async function restoreSession(): Promise<void> {
      const result = await client.currentAccount();
      if (!active) {
        return;
      }

      if ("error" in result) {
        setState({ status: "unavailable", message: result.error ?? "No fue posible comprobar la sesión" });
        return;
      }
      if (!result.data) {
        setState({ status: "unauthenticated" });
        onNavigate("/login");
        return;
      }

      setState({ status: "authorized", account: result.data });
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [apiOrigin, onNavigate]);

  if (state.status === "checking") {
    return <p class="private-status" aria-live="polite">Comprobando sesión…</p>;
  }
  if (state.status === "unauthenticated") {
    return <p class="private-status" aria-live="polite">Redirigiendo al inicio de sesión…</p>;
  }
  if (state.status === "unavailable") {
    return (
      <section class="private-panel" aria-live="polite">
        <h1>No pudimos confirmar tu sesión</h1>
        <p>{state.message}</p>
        <a href="/login">Volver a iniciar sesión</a>
      </section>
    );
  }

  function logout(): void {
    createAuthClient(apiOrigin).logout();
    setState({ status: "unauthenticated" });
    onNavigate("/");
  }

  return (
    <section class="private-panel">
      <p class="eyebrow">Sesión confirmada</p>
      <h1>Área privada</h1>
      <p>Conectado como <strong>{accountLabel(state.account)}</strong>.</p>
      <p class="form-intro">Todavía no hay proyectos ni herramientas de modelado en esta etapa.</p>
      <button type="button" onClick={logout}>Cerrar sesión</button>
    </section>
  );
}

function accountLabel(account: Account): string {
  const name = [account.firstName, account.lastName].filter(Boolean).join(" ");
  return name || account.email;
}

function navigate(path: string): void {
  window.location.assign(path);
}
