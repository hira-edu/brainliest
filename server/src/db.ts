import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../shared/schema'; // Adjust path if needed

config(); // Load .env file

// Prefer server-side env vars, fall back to VITE_ only if needed
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;
const databaseUrl =
  process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!supabaseUrl || !supabaseKey || !databaseUrl) {
  throw new Error(
    'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or VITE fallbacks), and DATABASE_URL must be set in the .env file.'
  );
}

// Supabase client (optimized for backend usage)
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
});

// Monitor auth state — this mostly applies to browser context
if (typeof supabase.auth.onAuthStateChange === 'function') {
  supabase.auth.onAuthStateChange((event, session) => {
    switch (event) {
      case 'SIGNED_IN':
        console.log('📊 Supabase authentication established');
        break;
      case 'SIGNED_OUT':
        console.log('📤 Supabase user signed out');
        break;
      case 'TOKEN_REFRESHED':
        console.log('🔄 Supabase token refreshed');
        break;
      case 'ERROR':
        console.error('❌ Supabase auth error:', session);
        break;
    }
  });
}

// Enhanced wrapper with logging for raw RPC queries
export const db = {
  ...supabase,
  query: async <T>(sql: string, params: any[] = []): Promise<T> => {
    try {
      const { data, error } = await supabase.rpc(sql, params);
      if (error) throw error;
      return data as T;
    } catch (error: any) {
      console.error('❌ Database query failed:', error.message);
      throw error;
    }
  },
};

// Connection check on startup
(async () => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('slug', { count: 'exact', head: true });
    if (error) throw error;
    console.log(
      `✅ Supabase connection verified. Found ${data?.length || 0} subjects.`
    );
  } catch (error: any) {
    console.error('❌ Supabase connection check failed:', error.message);
  }
})();
