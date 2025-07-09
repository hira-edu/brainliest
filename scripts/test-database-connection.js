#!/usr/bin/env node

// Database Connection Testing Script for Vercel + Neon Debugging
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

neonConfig.webSocketConstructor = ws;

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection for Vercel + Neon...\n');

  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  
  if (!process.env.DATABASE_URL) {
    console.log('\n❌ ERROR: DATABASE_URL environment variable is missing');
    console.log('Please set DATABASE_URL in your environment variables.');
    console.log('Format: postgresql://username:password@host:port/database?sslmode=require');
    process.exit(1);
  }

  // Parse connection string
  const dbUrl = new URL(process.env.DATABASE_URL);
  console.log('\n🔗 Connection String Analysis:');
  console.log(`   Host: ${dbUrl.hostname}`);
  console.log(`   Port: ${dbUrl.port || '5432'}`);
  console.log(`   Database: ${dbUrl.pathname.slice(1)}`);
  console.log(`   Username: ${dbUrl.username}`);
  console.log(`   SSL Mode: ${dbUrl.searchParams.get('sslmode') || 'not specified'}`);

  // Check if SSL mode is required for Neon
  if (!dbUrl.searchParams.get('sslmode')) {
    console.log('\n⚠️  WARNING: No SSL mode specified. Neon requires ?sslmode=require');
    console.log('Your connection string should end with: ?sslmode=require');
  }

  // Test connection pool creation
  console.log('\n🏊 Creating Connection Pool...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    min: 0,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true
  });

  pool.on('connect', () => {
    console.log('✅ Pool connection established');
  });

  pool.on('error', (err) => {
    console.error('❌ Pool error:', err.message);
  });

  // Test database operations
  try {
    console.log('\n🗄️  Testing Database Operations...');
    
    const db = drizzle({ client: pool, schema });
    
    // Test 1: Simple connection test
    console.log('   Test 1: Basic connection...');
    const client = await pool.connect();
    console.log('   ✅ Basic connection successful');
    client.release();

    // Test 2: Schema query
    console.log('   Test 2: Schema query...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`   ✅ Found ${tables.rows.length} tables in database`);

    // Test 3: Subjects table query
    console.log('   Test 3: Subjects table query...');
    const subjects = await db.select().from(schema.subjects).limit(5);
    console.log(`   ✅ Successfully queried subjects table: ${subjects.length} records`);

    // Test 4: Connection pool stress test
    console.log('   Test 4: Connection pool test...');
    const promises = Array.from({ length: 5 }, async (_, i) => {
      const result = await db.select().from(schema.subjects).limit(1);
      return result.length;
    });
    
    const results = await Promise.all(promises);
    console.log(`   ✅ Pool handled ${results.length} concurrent connections`);

    console.log('\n🎉 All database tests passed!');
    console.log('\n✅ Your database is properly configured for Vercel deployment');
    
  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'Unknown'}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Troubleshooting ENOTFOUND:');
      console.log('   - Check if your Neon database is active (not suspended)');
      console.log('   - Verify the hostname in your connection string');
      console.log('   - Ensure you have internet connectivity');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting ECONNREFUSED:');
      console.log('   - Check if the port number is correct (usually 5432)');
      console.log('   - Verify your database is accepting connections');
    }
    
    if (error.message.includes('password')) {
      console.log('\n💡 Troubleshooting Authentication:');
      console.log('   - Check username and password in connection string');
      console.log('   - Ensure special characters are URL-encoded');
    }
    
    if (error.message.includes('SSL') || error.message.includes('ssl')) {
      console.log('\n💡 Troubleshooting SSL:');
      console.log('   - Add ?sslmode=require to your connection string');
      console.log('   - Neon requires SSL connections');
    }

    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Connection pool closed');
  }
}

// Run the test
testDatabaseConnection().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});