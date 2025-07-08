// Vercel serverless function wrapper for Express app
import express from 'express';
import cors from 'cors';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema.js';

neonConfig.webSocketConstructor = ws;

const app = express();
app.use(cors());
app.use(express.json());

// Database setup
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic subjects endpoint
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await db.select().from(schema.subjects);
    res.json(subjects);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Export for Vercel
export default app;