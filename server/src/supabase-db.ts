/**
 * Native Supabase Database Connection
 * Replaces Neon adapter with native Supabase client for better integration
 */

import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../shared/schema";

// Environment validation
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL must be set");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set");
}

// Native Supabase client for real-time, auth, storage, etc.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  }
);

// Postgres.js client for Drizzle ORM (better performance than HTTP)
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  prepare: false,
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Drizzle ORM with postgres.js (faster than HTTP adapter)
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

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
