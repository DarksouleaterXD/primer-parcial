import { DataSource, type DataSourceOptions } from "typeorm";

import { AddUserNames1736900000000 } from "../src/migrations/1736900000000-add-user-names.js";
import { CreateUsers1736800000000 } from "../src/migrations/1736800000000-create-users.js";
import { User } from "../src/users/user.entity.js";

export const testEnvironment = {
  API_PORT: "3000",
  WEB_ORIGIN: "http://localhost:4321",
  POSTGRES_HOST: "127.0.0.1",
  POSTGRES_PORT: "5432",
  POSTGRES_DB: "primer_parcial_test",
  POSTGRES_USER: "primer_parcial_local",
  POSTGRES_PASSWORD: "local-example-only",
  JWT_SECRET: "test-jwt-secret-only",
  JWT_EXPIRES_IN_SECONDS: "60",
  BCRYPT_COST: "4",
} as const;

export async function prepareTestDatabase(): Promise<void> {
  const admin = new DataSource(databaseOptions("postgres"));

  await admin.initialize();
  try {
    const databases = await admin.query<{ exists: boolean }[]>(
      "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      [testEnvironment.POSTGRES_DB],
    );

    if (!databases[0]?.exists) {
      await admin.query(`CREATE DATABASE "${testEnvironment.POSTGRES_DB}"`);
    }
  } finally {
    await admin.destroy();
  }

  const testDatabase = new DataSource({
    ...databaseOptions(testEnvironment.POSTGRES_DB),
    entities: [User],
    migrations: [CreateUsers1736800000000, AddUserNames1736900000000],
    synchronize: false,
  });

  await testDatabase.initialize();
  try {
    await testDatabase.runMigrations();
    await testDatabase.query('TRUNCATE TABLE "users"');
  } finally {
    await testDatabase.destroy();
  }
}

export async function getStoredPasswordHash(email: string): Promise<string | undefined> {
  const dataSource = new DataSource(databaseOptions(testEnvironment.POSTGRES_DB));

  await dataSource.initialize();
  try {
    const rows = await dataSource.query<{ password_hash: string }[]>(
      'SELECT "password_hash" FROM "users" WHERE "email" = $1',
      [email],
    );
    return rows[0]?.password_hash;
  } finally {
    await dataSource.destroy();
  }
}

export async function getStoredAccount(email: string): Promise<{
  readonly first_name: string | null;
  readonly last_name: string | null;
} | undefined> {
  const dataSource = new DataSource(databaseOptions(testEnvironment.POSTGRES_DB));

  await dataSource.initialize();
  try {
    const rows = await dataSource.query<{ first_name: string | null; last_name: string | null }[]>(
      'SELECT "first_name", "last_name" FROM "users" WHERE "email" = $1',
      [email],
    );
    return rows[0];
  } finally {
    await dataSource.destroy();
  }
}

export async function insertLegacyAccount(
  id: string,
  email: string,
  passwordHash: string,
): Promise<void> {
  const dataSource = new DataSource(databaseOptions(testEnvironment.POSTGRES_DB));

  await dataSource.initialize();
  try {
    await dataSource.query(
      'INSERT INTO "users" ("id", "email", "password_hash") VALUES ($1, $2, $3)',
      [id, email, passwordHash],
    );
  } finally {
    await dataSource.destroy();
  }
}

function databaseOptions(database: string): DataSourceOptions {
  return {
    type: "postgres",
    host: testEnvironment.POSTGRES_HOST,
    port: Number(testEnvironment.POSTGRES_PORT),
    username: testEnvironment.POSTGRES_USER,
    password: testEnvironment.POSTGRES_PASSWORD,
    database,
    synchronize: false,
  };
}
