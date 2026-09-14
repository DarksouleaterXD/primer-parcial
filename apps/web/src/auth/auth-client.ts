import {
  accountSchema,
  loginSchema,
  registerSchema,
  sessionSchema,
  type Account,
  type LoginCredentials,
  type RegisterCredentials,
} from "@primer-parcial/contracts";

const SESSION_TOKEN_KEY = "primer-parcial.session-token";

export type AuthResult<T> =
  | { readonly data: T; readonly error?: never }
  | { readonly data?: never; readonly error: string };

export interface AuthClient {
  register(registration: RegisterCredentials): Promise<AuthResult<Account>>;
  login(credentials: LoginCredentials): Promise<AuthResult<void>>;
  currentAccount(): Promise<AuthResult<Account | null>>;
  logout(): void;
  hasSession(): boolean;
}

interface AuthClientOptions {
  readonly fetch?: typeof fetch;
  readonly storage?: Storage;
}

export function createAuthClient(
  apiOrigin: string,
  { fetch: fetchImplementation = fetch, storage = window.sessionStorage }: AuthClientOptions = {},
): AuthClient {
  const origin = apiOrigin.replace(/\/$/, "");

  return {
    async register(registration) {
      const response = await request(fetchImplementation, `${origin}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });

      if (!response.ok) {
        return { error: await publicError(response, "No fue posible registrar la cuenta") };
      }

      return parseResponse(response, accountSchema, "La respuesta de registro no es válida");
    },

    async login(credentials) {
      const response = await request(fetchImplementation, `${origin}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        return { error: await publicError(response, "No fue posible iniciar sesión") };
      }

      const session = await parseResponse(response, sessionSchema, "La respuesta de sesión no es válida");
      if ("error" in session) {
        return { error: session.error };
      }

      storage.setItem(SESSION_TOKEN_KEY, session.data.accessToken);
      return { data: undefined };
    },

    async currentAccount() {
      const token = storage.getItem(SESSION_TOKEN_KEY);
      if (!token) {
        return { data: null };
      }

      const response = await request(fetchImplementation, `${origin}/api/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        storage.removeItem(SESSION_TOKEN_KEY);
        return { data: null };
      }
      if (!response.ok) {
        return { error: "No fue posible comprobar la sesión" };
      }

      return parseResponse(response, accountSchema, "La respuesta de sesión no es válida");
    },

    logout() {
      storage.removeItem(SESSION_TOKEN_KEY);
    },

    hasSession() {
      return storage.getItem(SESSION_TOKEN_KEY) !== null;
    },
  };
}

export function validateRegistration(
  input: RegisterCredentials,
): AuthResult<RegisterCredentials> {
  const result = registerSchema.safeParse(input);
  return result.success
    ? { data: result.data }
    : { error: "Ingresá nombres y apellidos, un email válido y una contraseña de 8 a 72 bytes" };
}

export function validateLogin(input: LoginCredentials): AuthResult<LoginCredentials> {
  const result = loginSchema.safeParse(input);
  return result.success
    ? { data: result.data }
    : { error: "Ingresá un email válido y una contraseña de 8 a 72 bytes" };
}

async function request(
  fetchImplementation: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetchImplementation(input, init);
  } catch {
    return new Response(null, { status: 503 });
  }
}

async function parseResponse<T>(
  response: Response,
  schema: { safeParse(input: unknown): { success: true; data: T } | { success: false } },
  fallback: string,
): Promise<AuthResult<T>> {
  try {
    const result = schema.safeParse(await response.json());
    return result.success ? { data: result.data } : { error: fallback };
  } catch {
    return { error: fallback };
  }
}

async function publicError(response: Response, fallback: string): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
    ) {
      return payload.message;
    }
  } catch {
    // A malformed error body must not leak an implementation detail to the UI.
  }

  return fallback;
}
