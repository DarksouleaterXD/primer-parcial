import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

import {
  createAuthClient,
  validateLogin,
  validateRegistration,
} from "../auth/auth-client";

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const errorReference = useRef<HTMLParagraphElement>(null);
  const content = copy[mode];

  useLayoutEffect(() => {
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

    if (mode === "register") {
      const registration = validateRegistration({ firstName, lastName, email, password });
      if ("error" in registration) {
        setError(registration.error);
        return;
      }

      setIsSubmitting(true);
      const result = await createAuthClient(apiOrigin).register(registration.data);
      setIsSubmitting(false);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      setPassword("");
      setMessage("Cuenta creada. Ahora podés iniciar sesión.");
      return;
    }

    const credentials = validateLogin({ email, password });
    if ("error" in credentials) {
      setError(credentials.error);
      return;
    }

    setIsSubmitting(true);
    const result = await createAuthClient(apiOrigin).login(credentials.data);
    setIsSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }

    setPassword("");
    onNavigate("/workspace");
  }

  return (
    <form class="auth-form" aria-label={content.title} onSubmit={handleSubmit} noValidate>
      <h1>{content.title}</h1>
      <p class="form-intro">Usá tu email y una contraseña de al menos 8 caracteres.</p>

      {mode === "register" ? (
        <>
          <label for="register-first-name">Nombres</label>
          <input
            id="register-first-name"
            name="firstName"
            type="text"
            autocomplete="given-name"
            value={firstName}
            onInput={(event) => setFirstName(event.currentTarget.value)}
            aria-describedby={error ? "register-feedback" : undefined}
            required
          />

          <label for="register-last-name">Apellidos</label>
          <input
            id="register-last-name"
            name="lastName"
            type="text"
            autocomplete="family-name"
            value={lastName}
            onInput={(event) => setLastName(event.currentTarget.value)}
            aria-describedby={error ? "register-feedback" : undefined}
            required
          />
        </>
      ) : null}

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
