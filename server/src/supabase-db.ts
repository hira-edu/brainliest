/**
 * Native Supabase Database Connection
 * Updated for official Supabase-Vercel integration
 */

import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../shared/schema";

// Environment validation - Use new integration variables
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!databaseUrl) {
  throw new Error("POSTGRES_URL or DATABASE_URL must be set");
}

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL must be set");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set");
}

// Native Supabase client for real-time, auth, storage, etc.
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// PostgreSQL connection with connection pooling for Vercel
const connectionString = databaseUrl;
const sql = postgres(connectionString, {
  max: 1, // Important for serverless
  idle_timeout: 20,
  connect_timeout: 10,
});

// Drizzle ORM with schema
export const db = drizzle(sql, { schema });

// Enhanced Supabase functions with native client
export const supabaseOperations = {
  // Real-time subscriptions
  subscribeToTable(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`${table}_changes`)
      .on("postgres_changes", { event: "*", schema: "public", table }, callback)
      .subscribe();
  },

  // Storage operations
  async uploadFile(bucket: string, path: string, file: File | Buffer) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  },

  // RPC function calls
  async callFunction(functionName: string, params: any = {}) {
    const { data, error } = await supabase.rpc(functionName, params);
    if (error) throw error;
    return data;
  },

  // Edge function invocation
  async invokeEdgeFunction(functionName: string, body: any = {}) {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: JSON.stringify(body),
    });

    if (error) throw error;
    return data;
  },

  // Auth admin operations
  async createUser(email: string, password: string, metadata: any = {}) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: true,
    });

    if (error) throw error;
    return data;
  },

  // Batch operations with transactions
  async executeTransaction(operations: (() => Promise<any>)[]) {
    return await db.transaction(async (tx) => {
      const results = [];
      for (const operation of operations) {
        results.push(await operation());
      }
      return results;
    });
  },
};

// Health check function
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("count")
      .limit(1);
    if (error) throw error;
    return { status: "connected", timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("Supabase connection failed:", error);
    return { status: "failed", error: error.message };
  }
}
