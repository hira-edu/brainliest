import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../../shared/schema";

// Configure for remote Supabase (until local setup)
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Ensure Supabase is running locally with 'supabase start'",
  );
}

// SUPABASE LOCAL: Standard PostgreSQL connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Connection health monitoring
pool.on('connect', () => {
  console.log('📊 Database connection established with Supabase');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err);
});

export const db = drizzle({ 
  client: pool, 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

console.log('📊 Supabase PostgreSQL connection configured');
