import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  out: './packages/db/migrations',
  schema: './packages/db/src/schema/index.ts',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL ?? '',
  },
  strict: true,
});
