import { useEffect, useRef, useState } from "preact/hooks";

import { createAuthClient, validateCredentials } from "../auth/auth-client";

type FormMode = "register" | "login";

interface AuthFormProps {
  readonly apiOrigin: string;
  readonly mode: FormMode;
  readonly onNavigate?: (path: string) => void;
}

const copy = {
  register: {
    title: "Crear cuenta",
    submit: "Registrar cuenta",
    alternate: "¿Ya tenés una cuenta?",
    alternateHref: "/login",
    alternateLabel: "Iniciá sesión",
  },
  login: {
    title: "Iniciar sesión",
    submit: "Entrar al área privada",
    alternate: "¿Todavía no tenés una cuenta?",
    alternateHref: "/register",
    alternateLabel: "Registrate",
  },
} as const;

export function AuthForm({ apiOrigin, mode, onNavigate = navigate }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const errorReference = useRef<HTMLParagraphElement>(null);
  const content = copy[mode];

  useEffect(() => {
    if (error) {
      errorReference.current?.focus();
    }
  }, [error]);

  useEffect(() => {
    setIsReady(true);
  }, []);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(undefined);
    setMessage(undefined);

    const credentials = validateCredentials({ email, password });
    if ("error" in credentials) {
      setError(credentials.error);
      return;
    }

    setIsSubmitting(true);
    const client = createAuthClient(apiOrigin);
    const result =
      mode === "register"
        ? await client.register(credentials.data)
        : await client.login(credentials.data);
    setIsSubmitting(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setPassword("");
    if (mode === "register") {
      setMessage("Cuenta creada. Ahora podés iniciar sesión.");
      return;
    }

    onNavigate("/workspace");
  }

  return (
    <form class="auth-form" aria-label={content.title} onSubmit={handleSubmit} noValidate>
      <h1>{content.title}</h1>
      <p class="form-intro">Usá tu email y una contraseña de al menos 8 caracteres.</p>

      <label for={`${mode}-email`}>Email</label>
      <input
        id={`${mode}-email`}
        name="email"
        type="email"
        autocomplete="email"
        value={email}
        onInput={(event) => setEmail(event.currentTarget.value)}
        aria-describedby={error ? `${mode}-feedback` : undefined}
        required
      />

      <label for={`${mode}-password`}>Contraseña</label>
      <input
        id={`${mode}-password`}
        name="password"
        type="password"
        autocomplete={mode === "login" ? "current-password" : "new-password"}
        value={password}
        onInput={(event) => setPassword(event.currentTarget.value)}
        aria-describedby={error ? `${mode}-feedback` : undefined}
        minLength={8}
        required
      />

      {error ? (
        <p id={`${mode}-feedback`} class="feedback feedback-error" role="alert" tabIndex={-1} ref={errorReference}>
          {error}
        </p>
      ) : null}
      {message ? (
        <p class="feedback feedback-success" aria-live="polite">
          {message}
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting || !isReady}>
        {isSubmitting ? "Procesando…" : content.submit}
      </button>
      <p class="form-switch">
        {content.alternate} <a href={content.alternateHref}>{content.alternateLabel}</a>
      </p>
    </form>
  );
}

function navigate(path: string): void {
  window.location.assign(path);
}
