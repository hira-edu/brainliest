// Vercel serverless function wrapper for Express app
import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema.js';

const app = express();
app.use(cors());
app.use(express.json());

// Database setup with enhanced error handling
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  throw new Error('DATABASE_URL environment variable is required');
}

// Supabase HTTP connection for Vercel serverless
const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql, { schema });

// Connection monitoring
console.log('🔌 Supabase HTTP connection initialized for Vercel deployment');

// Enhanced health check with database connectivity test
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const result = await db.select().from(schema.subjects).limit(1);
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing'
    });
  } catch (error) {
    console.error('🔴 Health check database error:', error.message);
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      environment: process.env.NODE_ENV || 'development',
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing'
    });
  }
});

// Basic subjects endpoint with enhanced error logging
app.get('/api/subjects', async (req, res) => {
  try {
    console.log('🔍 Fetching subjects from database...');
    const subjects = await db.select().from(schema.subjects);
    console.log(`✅ Found ${subjects.length} subjects`);
    res.json(subjects);
  } catch (error) {
    console.error('🔴 Database error in /api/subjects:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Export for Vercel
export default app;