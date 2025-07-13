#!/usr/bin/env node

/**
 * Vercel Supabase Database Setup Script
 * 
 * This script handles Supabase database schema setup and data seeding for Vercel deployment.
 * Uses HTTP PostgreSQL adapter for serverless compatibility with Supabase.
 * Can be run as a build step or manually after deployment.
 */

// Using HTTP PostgreSQL adapter for Supabase database connection
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.log('💡 Make sure to set DATABASE_URL in your Vercel environment variables');
  process.exit(1);
}

async function setupVercelDatabase() {
  console.log('🚀 Setting up Supabase Database for Vercel...\n');
  
  try {
    // Initialize Supabase database connection using HTTP adapter
    console.log('🔗 Connecting to Supabase via HTTP...');
    const sqlClient = neon(DATABASE_URL);
    const db = drizzle(sqlClient, { schema });
    console.log('✅ Supabase HTTP connection established');
    
    console.log('🔍 Testing database connection...');
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');
    
    // Check if schema exists
    console.log('🔍 Checking database schema...');
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('subjects', 'exams', 'questions')
    `);
    
    if (tableCheck.length === 0) {
      console.log('⚠️  Database schema not found');
      console.log('📝 You need to push the schema first:');
      console.log('   npm run db:push');
      console.log('   OR run the migration script:');
      console.log('   psql $DATABASE_URL -f migrations/supabase-export.sql');
      return;
    }
    
    console.log(`✅ Found ${tableCheck.length} core tables in database schema`);
    
    // Check if data exists
    console.log('🔍 Checking existing data...');
    const subjects = await db.select().from(schema.subjects);
    const exams = await db.select().from(schema.exams);
    const questions = await db.select().from(schema.questions);
    
    console.log(`📊 Current data:
   Subjects: ${subjects.length}
   Exams: ${exams.length}
   Questions: ${questions.length}`);
    
    if (subjects.length === 0) {
      console.log('🌱 No data found. Starting seeding process...');
      await seedData(db);
    } else {
      console.log('✅ Database already contains data');
    }
    
    // Final verification
    await verifySetup(db);
    
    console.log('\n🎉 Vercel database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Verify DATABASE_URL is correct');
    console.log('2. Check if Supabase project is active');
    console.log('3. Ensure connection string includes SSL mode');
    console.log('4. Verify Vercel environment variables are set');
    process.exit(1);
  }
}

async function seedData(db) {
  console.log('📊 Seeding categories...');
  
  // Categories
  const categories = [
    {
      slug: 'technology',
      name: 'Technology',
      description: 'IT and software development certifications',
      icon: 'laptop',
      color: '#3B82F6'
    },
    {
      slug: 'business-management',
      name: 'Business & Management',
      description: 'Project management and business certifications',
      icon: 'briefcase',
      color: '#059669'
    },
    {
      slug: 'cybersecurity',
      name: 'Cybersecurity',
      description: 'Information security and ethical hacking',
      icon: 'shield',
      color: '#DC2626'
    }
  ];
  
  for (const category of categories) {
    await db.insert(schema.categories)
      .values(category)
      .onConflictDoNothing();
  }
  
  // Subcategories
  const subcategories = [
    {
      slug: 'cloud-computing',
      name: 'Cloud Computing',
      description: 'AWS, Azure, Google Cloud certifications',
      icon: 'cloud',
      color: '#3B82F6',
      categorySlug: 'technology'
    },
    {
      slug: 'project-management',
      name: 'Project Management',
      description: 'PMP, Agile, Scrum certifications',
      icon: 'calendar',
      color: '#059669',
      categorySlug: 'business-management'
    }
  ];
  
  for (const subcategory of subcategories) {
    await db.insert(schema.subcategories)
      .values(subcategory)
      .onConflictDoNothing();
  }
  
  console.log('📚 Seeding subjects...');
  
  // Core subjects
  const subjects = [
    {
      slug: 'pmp-certification',
      name: 'PMP Certification',
      description: 'Project Management Professional certification preparation',
      icon: 'award',
      color: '#059669',
      categorySlug: 'business-management',
      subcategorySlug: 'project-management',
      examCount: 2,
      questionCount: 5
    },
    {
      slug: 'aws-solutions-architect',
      name: 'AWS Solutions Architect',
      description: 'AWS Solutions Architect Associate certification',
      icon: 'cloud',
      color: '#FF9900',
      categorySlug: 'technology',
      subcategorySlug: 'cloud-computing',
      examCount: 2,
      questionCount: 4
    },
    {
      slug: 'azure-fundamentals',
      name: 'Azure Fundamentals',
      description: 'Microsoft Azure AZ-900 certification preparation',
      icon: 'microsoft',
      color: '#0078D4',
      categorySlug: 'technology',
      subcategorySlug: 'cloud-computing',
      examCount: 1,
      questionCount: 3
    }
  ];
  
  for (const subject of subjects) {
    await db.insert(schema.subjects)
      .values(subject)
      .onConflictDoNothing();
  }
  
  console.log('📝 Seeding exams...');
  
  // Sample exams
  const exams = [
    {
      slug: 'pmp-practice-exam-1',
      subjectSlug: 'pmp-certification',
      title: 'PMP Practice Exam 1',
      description: 'Comprehensive PMP practice questions',
      icon: 'clipboard',
      questionCount: 3,
      duration: 180,
      difficulty: 'Intermediate',
      isActive: true
    },
    {
      slug: 'aws-saa-practice-1',
      subjectSlug: 'aws-solutions-architect',
      title: 'AWS SAA Practice Test',
      description: 'AWS Solutions Architect practice questions',
      icon: 'cloud',
      questionCount: 2,
      duration: 120,
      difficulty: 'Intermediate',
      isActive: true
    }
  ];
  
  for (const exam of exams) {
    await db.insert(schema.exams)
      .values(exam)
      .onConflictDoNothing();
  }
  
  console.log('❓ Seeding questions...');
  
  // Sample questions
  const questions = [
    {
      examSlug: 'pmp-practice-exam-1',
      subjectSlug: 'pmp-certification',
      questionText: 'What is the primary purpose of a project charter?',
      options: [
        'To formally authorize the project',
        'To define project scope in detail',
        'To identify all project risks',
        'To create the project schedule'
      ],
      correctAnswers: [0],
      explanation: 'The project charter formally authorizes the project and gives the project manager authority to apply organizational resources.',
      difficulty: 'Intermediate',
      domain: 'Initiating',
      allowMultipleAnswers: false
    },
    {
      examSlug: 'aws-saa-practice-1',
      subjectSlug: 'aws-solutions-architect',
      questionText: 'Which AWS service provides managed NoSQL database?',
      options: [
        'Amazon RDS',
        'Amazon DynamoDB',
        'Amazon Redshift',
        'Amazon Aurora'
      ],
      correctAnswers: [1],
      explanation: 'Amazon DynamoDB is a fully managed NoSQL database service.',
      difficulty: 'Beginner',
      domain: 'Database',
      allowMultipleAnswers: false
    }
  ];
  
  for (const question of questions) {
    await db.insert(schema.questions)
      .values(question)
      .onConflictDoNothing();
  }
  
  console.log('📈 Seeding user interactions...');
  
  // Sample interactions for trending
  const interactions = [
    {
      subjectSlug: 'pmp-certification',
      interactionType: 'view',
      interactionCount: 100,
      createdAt: new Date()
    },
    {
      subjectSlug: 'aws-solutions-architect',
      interactionType: 'view',
      interactionCount: 85,
      createdAt: new Date()
    }
  ];
  
  for (const interaction of interactions) {
    await db.insert(schema.userSubjectInteractions)
      .values(interaction)
      .onConflictDoNothing();
  }
}

async function verifySetup(db) {
  console.log('🔍 Verifying database setup...');
  
  const subjectCount = await db.select({ count: sql`count(*)` }).from(schema.subjects);
  const examCount = await db.select({ count: sql`count(*)` }).from(schema.exams);
  const questionCount = await db.select({ count: sql`count(*)` }).from(schema.questions);
  
  console.log('✅ Database verification:');
  console.log(`   Subjects: ${subjectCount[0].count}`);
  console.log(`   Exams: ${examCount[0].count}`);
  console.log(`   Questions: ${questionCount[0].count}`);
  
  if (subjectCount[0].count > 0 && examCount[0].count > 0 && questionCount[0].count > 0) {
    console.log('✅ Database setup verification passed');
  } else {
    console.log('⚠️  Database setup verification failed');
    throw new Error('Database verification failed - missing data');
  }
}

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupVercelDatabase()
    .then(() => {
      console.log('\n🚀 Ready for deployment!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

export { setupVercelDatabase };