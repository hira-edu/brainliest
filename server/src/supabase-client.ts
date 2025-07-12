// Supabase SQL functions using HTTP adapter only
import { neon } from '@neondatabase/serverless';

// Get HTTP SQL connection for direct Supabase operations
const getSupabaseSQL = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }
  return neon(process.env.DATABASE_URL);
};

// Supabase SQL helpers using HTTP adapter
export const supabaseOperations = {
  // Authentication operations via SQL
  async createUser(email: string, password: string, metadata: any = {}) {
    const sql = getSupabaseSQL();
    return await sql`
      INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
      VALUES (${email}, crypt(${password}, gen_salt('bf')), NOW(), ${sql.json({})}, ${sql.json(metadata)})
      RETURNING id, email, created_at
    `;
  },

  // RLS policy operations
  async enableRLS(tableName: string) {
    const sql = getSupabaseSQL();
    return await sql`
      ALTER TABLE ${sql(tableName)} ENABLE ROW LEVEL SECURITY
    `;
  },

  // Storage operations via SQL
  async listStorageObjects(bucketName: string) {
    const sql = getSupabaseSQL();
    return await sql`
      SELECT name, size, created_at, updated_at 
      FROM storage.objects 
      WHERE bucket_id = ${bucketName}
      ORDER BY created_at DESC
    `;
  },

  // Real-time operations via SQL triggers
  async createRealtimeTrigger(tableName: string) {
    const sql = getSupabaseSQL();
    return await sql`
      CREATE OR REPLACE FUNCTION notify_${sql(tableName)}_changes()
      RETURNS trigger AS $$
      BEGIN
        PERFORM pg_notify('${sql(tableName)}_changes', row_to_json(NEW)::text);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS ${sql(tableName)}_notify ON ${sql(tableName)};
      CREATE TRIGGER ${sql(tableName)}_notify
        AFTER INSERT OR UPDATE OR DELETE ON ${sql(tableName)}
        FOR EACH ROW EXECUTE FUNCTION notify_${sql(tableName)}_changes();
    `;
  },

  // Advanced Supabase queries
  async getSubjectsWithStats() {
    const sql = getSupabaseSQL();
    return await sql`
      SELECT 
        s.*,
        COUNT(e.slug) as exam_count,
        COUNT(q.id) as total_questions,
        COALESCE(AVG(us.completion_rate), 0) as avg_completion_rate
      FROM subjects s
      LEFT JOIN exams e ON s.slug = e.subject_slug AND e.is_active = true
      LEFT JOIN questions q ON e.slug = q.exam_slug
      LEFT JOIN user_sessions us ON e.slug = us.exam_slug
      GROUP BY s.slug, s.name, s.description, s.icon, s.color, s.category_slug, s.subcategory_slug
      ORDER BY s.name
    `;
  }
};

console.log('🚀 Supabase SQL operations initialized');