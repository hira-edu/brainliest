import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import * as schema from './schema';

type DrizzleDb = PostgresJsDatabase<typeof schema>;

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const { DATABASE_URL: defaultDatabaseUrl } = databaseEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
});

let cachedClient: DrizzleDb | undefined;

export function createDrizzleClient(databaseUrl: string = defaultDatabaseUrl): DrizzleDb {
  const connection = postgres(databaseUrl, {
    prepare: false,
    max: 4,
  });

  return drizzle(connection, { schema, logger: false });
}

export function getDrizzleClient(): DrizzleDb {
  if (!cachedClient) {
    cachedClient = createDrizzleClient();
  }

  return cachedClient;
}

export const drizzleClient = getDrizzleClient();

export type DatabaseClient = DrizzleDb;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
