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

// PERFORMANCE OPTIMIZED: Enhanced connection pool configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum connections
  min: 5,                     // Minimum connections  
  idleTimeoutMillis: 30000,   // 30s idle timeout
  connectionTimeoutMillis: 2000, // 2s connection timeout
  maxUses: 7500,             // Connection recycling
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  allowExitOnIdle: true
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
