import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../../shared/schema";

// Fixed: Server-side WebSocket safety check
if (typeof window !== 'undefined') {
  throw new Error('Database connection not supported in browser environment');
}

neonConfig.webSocketConstructor = ws;

// Fixed: Enhanced environment variable handling with proper error context
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Please check your environment variables. For Vercel deployment, ensure DATABASE_URL is configured in the dashboard.",
  );
}

// Fixed: Validate database URL format
try {
  const url = new URL(databaseUrl);
  if (!url.hostname || !url.username) {
    throw new Error('Invalid DATABASE_URL format. Expected: postgresql://username:password@host:port/database');
  }
} catch (error) {
  throw new Error(`Invalid DATABASE_URL format: ${error.message}`);
}

// Fixed: Enhanced VERCEL + NEON OPTIMIZED connection pool with SSL and improved timeout settings
export const pool = new Pool({
  connectionString: databaseUrl,
  max: 3,                       // Conservative for Neon free tier (100 max total)
  min: 0,                       // No minimum connections for serverless
  idleTimeoutMillis: 10000,     // Shorter idle timeout for serverless
  connectionTimeoutMillis: 10000, // Fixed: Increased timeout for Vercel cold starts
  maxUses: 1000,               // Fixed: Reduced for Neon free tier compatibility
  keepAlive: false,            // Disabled for serverless functions
  allowExitOnIdle: true,       // Allow process exit when idle
  ssl: {                       // Fixed: Explicit SSL configuration for Neon
    rejectUnauthorized: true
  }
});

// Fixed: Enhanced connection health monitoring with comprehensive error handling
pool.on('connect', (client) => {
  const timestamp = new Date().toISOString();
  console.log(`📊 [${timestamp}] Database connection established`);
  
  // Fixed: Log connection details in development
  if (process.env.NODE_ENV === 'development') {
    const url = new URL(databaseUrl);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   SSL: ${url.searchParams.get('sslmode') || 'enabled'}`);
  }
});

pool.on('error', (err) => {
  const timestamp = new Date().toISOString();
  console.error(`❌ [${timestamp}] Database pool error:`, {
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  // Fixed: Enhanced error context for common issues
  if (err.code === 'ENOTFOUND') {
    console.error('   💡 Check: Database hostname and internet connectivity');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('   💡 Check: Database port and firewall settings');
  } else if (err.message?.includes('SSL')) {
    console.error('   💡 Check: SSL configuration in connection string');
  } else if (err.message?.includes('authentication')) {
    console.error('   💡 Check: Username and password in DATABASE_URL');
  }
});

// Fixed: Enhanced Drizzle configuration with production-ready logging
export const db = drizzle({ 
  client: pool, 
  schema,
  logger: {
    logQuery: (query, params) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Query:', query);
        if (params && params.length > 0) {
          console.log('📝 Params:', params);
        }
      } else {
        // Fixed: Production logging for errors only
        if (query.toLowerCase().includes('error') || query.toLowerCase().includes('fail')) {
          console.error('🚨 Query Error:', query);
        }
      }
    }
  }
});

// Fixed: Export health check function for API routes
export async function checkDatabaseHealth(): Promise<{ status: string; details?: any }> {
  try {
    // Test basic connectivity
    const result = await db.select().from(schema.subjects).limit(1);
    
    return {
      status: 'healthy',
      details: {
        connected: true,
        tablesAccessible: true,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      }
    };
  }
}
