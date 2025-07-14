#!/usr/bin/env node

/**
 * Production Data Seeding Script for Supabase + Vercel Deployment
 * 
 * This script seeds the production Supabase database with initial data
 * when deployed to Vercel. Uses HTTP PostgreSQL adapter for serverless compatibility.
 * Designed to be idempotent and safe to run multiple times.
 */

// Using HTTP PostgreSQL adapter that works with any PostgreSQL database including Supabase
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function seedProductionDatabase() {
  console.log('🌱 Starting Production Database Seeding...\n');
  
  try {
    // Initialize Supabase database connection using HTTP adapter
    console.log('🔗 Connecting to Supabase database via HTTP...');
    const sql = neon(DATABASE_URL);
    const db = drizzle(sql, { schema });
    console.log('✅ Supabase HTTP connection established');
    
    // Check if data already exists
    const existingSubjects = await db.select().from(schema.subjects);
    
    if (existingSubjects.length > 0) {
      console.log(`✅ Database already contains ${existingSubjects.length} subjects`);
      console.log('🔄 Skipping seeding (data exists)');
      return;
    }
    
    console.log('📊 Seeding Categories...');
    await seedCategories(db);
    
    console.log('📚 Seeding Subjects...');
    await seedSubjects(db);
    
    console.log('📝 Seeding Exams...');
    await seedExams(db);
    
    console.log('❓ Seeding Questions...');
    await seedQuestions(db);
    
    console.log('📈 Seeding User Interactions...');
    await seedUserInteractions(db);
    
    console.log('\n✅ Production database seeding completed successfully!');
    
    // Verify seeding
    const stats = await getStats(db);
    console.log('\n📊 Final Statistics:');
    console.log(`   Subjects: ${stats.subjects}`);
    console.log(`   Exams: ${stats.exams}`);
    console.log(`   Questions: ${stats.questions}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

async function seedCategories(db) {
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
    },
    {
      slug: 'ethical-hacking',
      name: 'Ethical Hacking',
      description: 'Penetration testing and security assessments',
      icon: 'bug',
      color: '#DC2626',
      categorySlug: 'cybersecurity'
    }
  ];
  
  for (const subcategory of subcategories) {
    await db.insert(schema.subcategories)
      .values(subcategory)
      .onConflictDoNothing();
  }
}

async function seedSubjects(db) {
  const subjects = [
    {
      slug: 'pmp-certification',
      name: 'PMP Certification',
      description: 'Project Management Professional certification preparation',
      icon: 'award',
      color: '#059669',
      categorySlug: 'business-management',
      subcategorySlug: 'project-management',
      examCount: 3,
      questionCount: 8
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
      questionCount: 6
    },
    {
      slug: 'azure-fundamentals',
      name: 'Azure Fundamentals',
      description: 'Microsoft Azure AZ-900 certification preparation',
      icon: 'microsoft',
      color: '#0078D4',
      categorySlug: 'technology',
      subcategorySlug: 'cloud-computing',
      examCount: 2,
      questionCount: 5
    },
    {
      slug: 'comptia-security-plus',
      name: 'CompTIA Security+',
      description: 'CompTIA Security+ SY0-601 certification',
      icon: 'shield',
      color: '#E31837',
      categorySlug: 'cybersecurity',
      subcategorySlug: 'ethical-hacking',
      examCount: 2,
      questionCount: 6
    },
    {
      slug: 'cisco-ccna',
      name: 'Cisco CCNA',
      description: 'Cisco Certified Network Associate certification',
      icon: 'network',
      color: '#1BA0D7',
      categorySlug: 'technology',
      subcategorySlug: 'cloud-computing',
      examCount: 2,
      questionCount: 7
    }
  ];
  
  for (const subject of subjects) {
    await db.insert(schema.subjects)
      .values(subject)
      .onConflictDoNothing();
  }
}

async function seedExams(db) {
  const exams = [
    {
      slug: 'pmp-practice-exam-1',
      subjectSlug: 'pmp-certification',
      title: 'PMP Practice Exam 1',
      description: 'Comprehensive PMP practice questions covering all knowledge areas',
      icon: 'clipboard',
      questionCount: 3,
      duration: 240,
      difficulty: 'Intermediate',
      isActive: true
    },
    {
      slug: 'aws-saa-practice-1',
      subjectSlug: 'aws-solutions-architect',
      title: 'AWS SAA Practice Test 1',
      description: 'AWS Solutions Architect Associate practice questions',
      icon: 'cloud',
      questionCount: 3,
      duration: 130,
      difficulty: 'Intermediate',
      isActive: true
    },
    {
      slug: 'azure-fundamentals-practice',
      subjectSlug: 'azure-fundamentals',
      title: 'Azure AZ-900 Practice Test',
      description: 'Microsoft Azure Fundamentals practice questions',
      icon: 'microsoft',
      questionCount: 2,
      duration: 85,
      difficulty: 'Beginner',
      isActive: true
    }
  ];
  
  for (const exam of exams) {
    await db.insert(schema.exams)
      .values(exam)
      .onConflictDoNothing();
  }
}

async function seedQuestions(db) {
  const questions = [
    // PMP Questions
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
      explanation: 'The project charter formally authorizes the project and gives the project manager authority to apply organizational resources to project activities.',
      difficulty: 'Intermediate',
      domain: 'Initiating',
      allowMultipleAnswers: false
    },
    {
      examSlug: 'pmp-practice-exam-1',
      subjectSlug: 'pmp-certification',
      questionText: 'Which of the following is NOT a characteristic of a project?',
      options: [
        'Temporary endeavor',
        'Unique product or service',
        'Ongoing operations',
        'Progressive elaboration'
      ],
      correctAnswers: [2],
      explanation: 'Projects are temporary endeavors, not ongoing operations. Ongoing operations are repetitive and continuous.',
      difficulty: 'Beginner',
      domain: 'Initiating',
      allowMultipleAnswers: false
    },
    // AWS Questions
    {
      examSlug: 'aws-saa-practice-1',
      subjectSlug: 'aws-solutions-architect',
      questionText: 'Which AWS service provides a managed NoSQL database?',
      options: [
        'Amazon RDS',
        'Amazon DynamoDB',
        'Amazon Redshift',
        'Amazon Aurora'
      ],
      correctAnswers: [1],
      explanation: 'Amazon DynamoDB is a fully managed NoSQL database service that provides fast and predictable performance.',
      difficulty: 'Beginner',
      domain: 'Database',
      allowMultipleAnswers: false
    },
    {
      examSlug: 'aws-saa-practice-1',
      subjectSlug: 'aws-solutions-architect',
      questionText: 'What is the maximum size of an S3 object?',
      options: [
        '5 GB',
        '5 TB',
        '100 GB',
        '1 TB'
      ],
      correctAnswers: [1],
      explanation: 'The maximum size of an S3 object is 5 TB (terabytes).',
      difficulty: 'Intermediate',
      domain: 'Storage',
      allowMultipleAnswers: false
    }
  ];
  
  for (const question of questions) {
    await db.insert(schema.questions)
      .values(question)
      .onConflictDoNothing();
  }
}

async function seedUserInteractions(db) {
  const interactions = [
    {
      subjectSlug: 'pmp-certification',
      interactionType: 'view',
      interactionCount: 150,
      createdAt: new Date('2025-01-01')
    },
    {
      subjectSlug: 'aws-solutions-architect',
      interactionType: 'view',
      interactionCount: 120,
      createdAt: new Date('2025-01-01')
    },
    {
      subjectSlug: 'azure-fundamentals',
      interactionType: 'view',
      interactionCount: 95,
      createdAt: new Date('2025-01-01')
    },
    {
      subjectSlug: 'comptia-security-plus',
      interactionType: 'view',
      interactionCount: 110,
      createdAt: new Date('2025-01-01')
    },
    {
      subjectSlug: 'cisco-ccna',
      interactionType: 'view',
      interactionCount: 85,
      createdAt: new Date('2025-01-01')
    }
  ];
  
  for (const interaction of interactions) {
    await db.insert(schema.userSubjectInteractions)
      .values(interaction)
      .onConflictDoNothing();
  }
}

async function getStats(db) {
  const [subjectCount] = await db.select({ count: sql`count(*)` }).from(schema.subjects);
  const [examCount] = await db.select({ count: sql`count(*)` }).from(schema.exams);
  const [questionCount] = await db.select({ count: sql`count(*)` }).from(schema.questions);
  
  return {
    subjects: subjectCount.count,
    exams: examCount.count,
    questions: questionCount.count
  };
}

// Run the seeding if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProductionDatabase()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedProductionDatabase };