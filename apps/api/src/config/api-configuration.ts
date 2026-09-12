import type { DataSourceOptions } from "typeorm";

export interface ApiConfiguration {
  readonly port: number;
  readonly webOrigin: string;
  readonly database: DataSourceOptions;
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
  };
}

function readPort(value: string | undefined, fallback: number, name: string): number {
  if (!value) {
    return fallback;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${name} must be a valid TCP port`);
  }

  return port;
}
