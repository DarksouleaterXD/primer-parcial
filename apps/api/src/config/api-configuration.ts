import type { DataSourceOptions } from "typeorm";

export interface ApiConfiguration {
  readonly port: number;
  readonly webOrigin: string;
  readonly database: DataSourceOptions;
  readonly authentication: AuthenticationConfiguration;
}

export interface AuthenticationConfiguration {
  readonly jwtSecret: string;
  readonly jwtExpiresInSeconds: number;
  readonly bcryptCost: number;
}

export const API_CONFIGURATION = Symbol("API_CONFIGURATION");

export function readApiConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): ApiConfiguration {
  const webOrigin = environment.WEB_ORIGIN?.trim();

  if (!webOrigin || webOrigin === "*") {
    throw new Error("WEB_ORIGIN must be a specific origin");
  }

  try {
    new URL(webOrigin);
  } catch {
    throw new Error("WEB_ORIGIN must be a valid URL");
  }

  return {
    port: readPort(environment.API_PORT, 3000, "API_PORT"),
    webOrigin,
    database: {
      type: "postgres",
      host: environment.POSTGRES_HOST?.trim() || "127.0.0.1",
      port: readPort(environment.POSTGRES_PORT, 5432, "POSTGRES_PORT"),
      username: environment.POSTGRES_USER?.trim() || "primer_parcial_local",
      password: environment.POSTGRES_PASSWORD || "local-example-only",
      database: environment.POSTGRES_DB?.trim() || "primer_parcial",
      entities: [],
      synchronize: false,
    },
    authentication: {
      jwtSecret: readRequired(environment.JWT_SECRET, "JWT_SECRET"),
      jwtExpiresInSeconds: readPort(
        environment.JWT_EXPIRES_IN_SECONDS,
        undefined,
        "JWT_EXPIRES_IN_SECONDS",
      ),
      bcryptCost: readBcryptCost(environment.BCRYPT_COST),
    },
  };
}

function readRequired(value: string | undefined, name: string): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`${name} must be set`);
  }

  return trimmed;
}

function readPort(value: string | undefined, fallback: number | undefined, name: string): number {
  if (!value) {
    if (fallback === undefined) {
      throw new Error(`${name} must be set`);
    }

    return fallback;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${name} must be a valid TCP port`);
  }

  return port;
}

function readBcryptCost(value: string | undefined): number {
  const cost = readPort(value, undefined, "BCRYPT_COST");

  if (cost < 4 || cost > 31) {
    throw new Error("BCRYPT_COST must be between 4 and 31");
  }

  return cost;
}
