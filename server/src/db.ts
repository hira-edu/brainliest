// Supabase PostgreSQL connection using HTTP adapter
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Create HTTP PostgreSQL connection to Supabase
const sql = neon(process.env.DATABASE_URL!);

// Initialize Drizzle ORM with Supabase PostgreSQL database
export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

// Supabase direct SQL functions using the HTTP adapter
export const supabaseFunctions = {
  // Call Supabase RPC functions directly
  async callRPC(functionName: string, params: any = {}) {
    return await sql`SELECT ${sql(functionName)}(${sql.json(params)})`;
  },

  // Execute raw Supabase SQL
  async executeSQL(query: string, params: any[] = []) {
    return await sql(query, params);
  },

  // Get real-time data using HTTP polling
  async getSubjectsWithUpdates() {
    return await sql`
      SELECT *, 
             EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
      FROM subjects 
      ORDER BY updated_at DESC
    `;
  },

  // Call Supabase storage functions
  async getStorageInfo() {
    return await sql`
      SELECT bucket_id, name, size, created_at 
      FROM storage.objects 
      LIMIT 10
    `;
  }
};

console.log('🚀 Supabase PostgreSQL database connection established');
