// Supabase PostgreSQL connection using HTTP adapter for compatibility
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Ensure Supabase is running locally with 'supabase start'",
  );
}

// SUPABASE: HTTP-based connection for standard PostgreSQL compatibility
const sql = neon(process.env.DATABASE_URL!);

// Initialize Drizzle ORM with HTTP adapter for Supabase PostgreSQL
export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

console.log('🚀 Supabase PostgreSQL HTTP connection configured successfully');
