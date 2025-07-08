import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// VERCEL + NEON OPTIMIZED: Conservative connection pool for serverless deployment
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,                     // Conservative for Neon free tier (100 max total)
  min: 0,                     // No minimum connections for serverless
  idleTimeoutMillis: 10000,   // Shorter idle timeout for serverless
  connectionTimeoutMillis: 5000, // Longer timeout for cold starts
  maxUses: 7500,             // Connection recycling
  keepAlive: false,          // Disabled for serverless functions
  allowExitOnIdle: true      // Allow process exit when idle
});

// Connection health monitoring
pool.on('connect', () => {
  console.log('📊 Database connection established');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err);
});

export const db = drizzle({ 
  client: pool, 
  schema,
  logger: process.env.NODE_ENV === 'development'
});
