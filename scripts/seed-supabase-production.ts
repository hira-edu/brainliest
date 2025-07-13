#!/usr/bin/env tsx

/**
 * Production Supabase Database Seeding Script
 * Seeds comprehensive exam data for live Vercel deployment
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema';

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

console.log('🚀 Starting Supabase production database seeding...');

// Comprehensive certification categories
const categories = [
  {
    slug: 'project-management',
    name: 'Project Management',
    description: 'Professional project management certifications and methodologies',
    icon: 'folder-kanban',
    color: '#3B82F6'
  },
  {
    slug: 'cloud-computing',
    name: 'Cloud Computing',
    description: 'Cloud platforms, architecture, and infrastructure certifications',
    icon: 'cloud',
    color: '#10B981'
  },
  {
    slug: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Information security, risk management, and compliance certifications',
    icon: 'shield',
    color: '#F59E0B'
  },
  {
    slug: 'it-infrastructure',
    name: 'IT Infrastructure',
    description: 'Network, systems, and infrastructure management certifications',
    icon: 'server',
    color: '#8B5CF6'
  },
  {
    slug: 'data-analytics',
    name: 'Data & Analytics',
    description: 'Data science, analytics, and business intelligence certifications',
    icon: 'bar-chart',
    color: '#EF4444'
  },
  {
    slug: 'business-analysis',
    name: 'Business Analysis',
    description: 'Business analysis, process improvement, and strategy certifications',
    icon: 'briefcase',
    color: '#06B6D4'
  }
];

// Detailed subcategories
const subcategories = [
  // Project Management
  { slug: 'agile-scrum', name: 'Agile & Scrum', description: 'Agile methodologies and Scrum framework certifications', categorySlug: 'project-management', icon: 'zap' },
  { slug: 'traditional-pm', name: 'Traditional PM', description: 'Traditional project management methodologies', categorySlug: 'project-management', icon: 'calendar' },
  
  // Cloud Computing
  { slug: 'aws-cloud', name: 'Amazon Web Services', description: 'AWS cloud platform certifications', categorySlug: 'cloud-computing', icon: 'aws' },
  { slug: 'azure-cloud', name: 'Microsoft Azure', description: 'Azure cloud platform certifications', categorySlug: 'cloud-computing', icon: 'microsoft' },
  { slug: 'gcp-cloud', name: 'Google Cloud Platform', description: 'GCP cloud platform certifications', categorySlug: 'cloud-computing', icon: 'google' },
  
  // Cybersecurity
  { slug: 'security-fundamentals', name: 'Security Fundamentals', description: 'Core cybersecurity principles and practices', categorySlug: 'cybersecurity', icon: 'lock' },
  { slug: 'risk-compliance', name: 'Risk & Compliance', description: 'Risk management and regulatory compliance', categorySlug: 'cybersecurity', icon: 'shield-check' },
  
  // IT Infrastructure
  { slug: 'networking', name: 'Networking', description: 'Network design, implementation, and management', categorySlug: 'it-infrastructure', icon: 'network' },
  { slug: 'systems-admin', name: 'Systems Administration', description: 'Server and systems management', categorySlug: 'it-infrastructure', icon: 'server' },
  
  // Data Analytics
  { slug: 'data-science', name: 'Data Science', description: 'Data science and machine learning certifications', categorySlug: 'data-analytics', icon: 'brain' },
  { slug: 'business-intelligence', name: 'Business Intelligence', description: 'BI tools and analytics platforms', categorySlug: 'data-analytics', icon: 'trending-up' },
  
  // Business Analysis
  { slug: 'process-improvement', name: 'Process Improvement', description: 'Lean, Six Sigma, and process optimization', categorySlug: 'business-analysis', icon: 'trending-up' },
  { slug: 'requirements-analysis', name: 'Requirements Analysis', description: 'Requirements gathering and analysis techniques', categorySlug: 'business-analysis', icon: 'clipboard-list' }
];

// Comprehensive subjects with real certification programs
const subjects = [
  // Project Management
  {
    slug: 'pmp-certification',
    name: 'PMP Certification',
    description: 'Project Management Professional certification by PMI',
    icon: 'award',
    color: '#3B82F6',
    categorySlug: 'project-management',
    subcategorySlug: 'traditional-pm'
  },
  {
    slug: 'capm-certification',
    name: 'CAPM Certification',
    description: 'Certified Associate in Project Management by PMI',
    icon: 'certificate',
    color: '#3B82F6',
    categorySlug: 'project-management',
    subcategorySlug: 'traditional-pm'
  },
  {
    slug: 'csm-certification',
    name: 'Certified ScrumMaster',
    description: 'Scrum Alliance Certified ScrumMaster certification',
    icon: 'zap',
    color: '#10B981',
    categorySlug: 'project-management',
    subcategorySlug: 'agile-scrum'
  },
  {
    slug: 'psm-certification',
    name: 'Professional Scrum Master',
    description: 'Scrum.org Professional Scrum Master certification',
    icon: 'activity',
    color: '#10B981',
    categorySlug: 'project-management',
    subcategorySlug: 'agile-scrum'
  },

  // AWS Cloud
  {
    slug: 'aws-cloud-practitioner',
    name: 'AWS Cloud Practitioner',
    description: 'AWS Certified Cloud Practitioner foundational certification',
    icon: 'cloud',
    color: '#FF9900',
    categorySlug: 'cloud-computing',
    subcategorySlug: 'aws-cloud'
  },
  {
    slug: 'aws-solutions-architect',
    name: 'AWS Solutions Architect',
    description: 'AWS Certified Solutions Architect Associate certification',
    icon: 'building',
    color: '#FF9900',
    categorySlug: 'cloud-computing',
    subcategorySlug: 'aws-cloud'
  },
  {
    slug: 'aws-developer',
    name: 'AWS Developer',
    description: 'AWS Certified Developer Associate certification',
    icon: 'code',
    color: '#FF9900',
    categorySlug: 'cloud-computing',
    subcategorySlug: 'aws-cloud'
  },

  // Azure Cloud
  {
    slug: 'azure-fundamentals',
    name: 'Azure Fundamentals',
    description: 'Microsoft Azure Fundamentals AZ-900 certification',
    icon: 'cloud',
    color: '#0078D4',
    categorySlug: 'cloud-computing',
    subcategorySlug: 'azure-cloud'
  },
  {
    slug: 'azure-administrator',
    name: 'Azure Administrator',
    description: 'Microsoft Azure Administrator Associate AZ-104 certification',
    icon: 'settings',
    color: '#0078D4',
    categorySlug: 'cloud-computing',
    subcategorySlug: 'azure-cloud'
  },

  // Google Cloud
  {
    slug: 'gcp-cloud-engineer',
    name: 'Google Cloud Engineer',
    description: 'Google Cloud Associate Cloud Engineer certification',
    icon: 'cloud-lightning',
    color: '#4285F4',
    categorySlug: 'cloud-computing',
    subcategorySlug: 'gcp-cloud'
  },

  // Cybersecurity
  {
    slug: 'comptia-security-plus',
    name: 'CompTIA Security+',
    description: 'CompTIA Security+ foundational cybersecurity certification',
    icon: 'shield',
    color: '#E30613',
    categorySlug: 'cybersecurity',
    subcategorySlug: 'security-fundamentals'
  },
  {
    slug: 'cissp-certification',
    name: 'CISSP Certification',
    description: 'Certified Information Systems Security Professional',
    icon: 'shield-check',
    color: '#000080',
    categorySlug: 'cybersecurity',
    subcategorySlug: 'security-fundamentals'
  },
  {
    slug: 'cisa-certification',
    name: 'CISA Certification',
    description: 'Certified Information Systems Auditor',
    icon: 'search',
    color: '#800080',
    categorySlug: 'cybersecurity',
    subcategorySlug: 'risk-compliance'
  },

  // IT Infrastructure
  {
    slug: 'comptia-network-plus',
    name: 'CompTIA Network+',
    description: 'CompTIA Network+ networking fundamentals certification',
    icon: 'wifi',
    color: '#E30613',
    categorySlug: 'it-infrastructure',
    subcategorySlug: 'networking'
  },
  {
    slug: 'ccna-certification',
    name: 'Cisco CCNA',
    description: 'Cisco Certified Network Associate certification',
    icon: 'router',
    color: '#1BA0D7',
    categorySlug: 'it-infrastructure',
    subcategorySlug: 'networking'
  },

  // Data Analytics
  {
    slug: 'google-data-analytics',
    name: 'Google Data Analytics',
    description: 'Google Data Analytics Professional Certificate',
    icon: 'bar-chart-3',
    color: '#34A853',
    categorySlug: 'data-analytics',
    subcategorySlug: 'data-science'
  },
  {
    slug: 'tableau-desktop-specialist',
    name: 'Tableau Desktop Specialist',
    description: 'Tableau Desktop Specialist certification',
    icon: 'chart-line',
    color: '#E97627',
    categorySlug: 'data-analytics',
    subcategorySlug: 'business-intelligence'
  },

  // Business Analysis
  {
    slug: 'cbap-certification',
    name: 'CBAP Certification',
    description: 'Certified Business Analysis Professional',
    icon: 'clipboard-check',
    color: '#2563EB',
    categorySlug: 'business-analysis',
    subcategorySlug: 'requirements-analysis'
  },
  {
    slug: 'six-sigma-green-belt',
    name: 'Six Sigma Green Belt',
    description: 'Lean Six Sigma Green Belt certification',
    icon: 'target',
    color: '#059669',
    categorySlug: 'business-analysis',
    subcategorySlug: 'process-improvement'
  }
];

// Comprehensive exam data with real-world scenarios
const exams = [
  // PMP Exams
  {
    slug: 'pmp-fundamentals-exam',
    subjectSlug: 'pmp-certification',
    title: 'PMP Fundamentals Practice Exam',
    description: 'Core project management principles and PMI framework basics',
    icon: 'book-open',
    questionCount: 15,
    duration: 90,
    difficulty: 'Beginner' as const,
    isActive: true
  },
  {
    slug: 'pmp-advanced-simulation',
    subjectSlug: 'pmp-certification',
    title: 'PMP Advanced Simulation Exam',
    description: 'Advanced project scenarios and situational judgment questions',
    icon: 'brain',
    questionCount: 25,
    duration: 180,
    difficulty: 'Advanced' as const,
    isActive: true
  },
  {
    slug: 'pmp-agile-hybrid-exam',
    subjectSlug: 'pmp-certification',
    title: 'PMP Agile & Hybrid Approaches',
    description: 'Agile, hybrid, and adaptive project management approaches',
    icon: 'zap',
    questionCount: 20,
    duration: 120,
    difficulty: 'Intermediate' as const,
    isActive: true
  },

  // AWS Exams
  {
    slug: 'aws-cloud-practitioner-fundamentals',
    subjectSlug: 'aws-cloud-practitioner',
    title: 'AWS Cloud Practitioner Fundamentals',
    description: 'AWS cloud concepts, services, and billing fundamentals',
    icon: 'cloud',
    questionCount: 18,
    duration: 90,
    difficulty: 'Beginner' as const,
    isActive: true
  },
  {
    slug: 'aws-solutions-architect-practice',
    subjectSlug: 'aws-solutions-architect',
    title: 'AWS Solutions Architect Practice Exam',
    description: 'Designing distributed systems on AWS platform',
    icon: 'building',
    questionCount: 22,
    duration: 130,
    difficulty: 'Intermediate' as const,
    isActive: true
  },

  // Azure Exams
  {
    slug: 'azure-fundamentals-az900',
    subjectSlug: 'azure-fundamentals',
    title: 'Azure Fundamentals AZ-900 Practice',
    description: 'Microsoft Azure cloud services and solutions',
    icon: 'microsoft',
    questionCount: 16,
    duration: 85,
    difficulty: 'Beginner' as const,
    isActive: true
  },

  // CompTIA Exams
  {
    slug: 'comptia-security-plus-practice',
    subjectSlug: 'comptia-security-plus',
    title: 'CompTIA Security+ Practice Exam',
    description: 'Cybersecurity fundamentals and best practices',
    icon: 'shield',
    questionCount: 20,
    duration: 90,
    difficulty: 'Intermediate' as const,
    isActive: true
  },

  // Google Cloud Exam
  {
    slug: 'gcp-associate-cloud-engineer',
    subjectSlug: 'gcp-cloud-engineer',
    title: 'GCP Associate Cloud Engineer Practice',
    description: 'Google Cloud Platform infrastructure and services',
    icon: 'google',
    questionCount: 24,
    duration: 120,
    difficulty: 'Intermediate' as const,
    isActive: true
  },

  // Additional Certification Exams
  {
    slug: 'csm-scrum-fundamentals',
    subjectSlug: 'csm-certification',
    title: 'Certified ScrumMaster Fundamentals',
    description: 'Scrum framework, roles, and ceremonies',
    icon: 'users',
    questionCount: 12,
    duration: 60,
    difficulty: 'Beginner' as const,
    isActive: true
  },
  {
    slug: 'ccna-networking-basics',
    subjectSlug: 'ccna-certification',
    title: 'CCNA Networking Fundamentals',
    description: 'Cisco networking concepts and configuration',
    icon: 'wifi',
    questionCount: 18,
    duration: 105,
    difficulty: 'Intermediate' as const,
    isActive: true
  }
];

// Comprehensive question bank with detailed explanations
const questions = [
  // PMP Questions - Advanced Simulation
  {
    text: "A project manager is leading a complex software development project with multiple stakeholders. The project sponsor requests a change that would significantly impact the project timeline and budget. What should the project manager do FIRST?",
    options: [
      "Implement the change immediately since it's from the sponsor",
      "Assess the impact and submit a formal change request",
      "Reject the change to protect the project baseline",
      "Consult with the development team about feasibility"
    ],
    correctAnswer: 1,
    allowMultipleAnswers: false,
    explanation: "According to PMI best practices, any change request must go through proper change control process. The project manager should first assess the full impact (scope, time, cost, quality, resources, and risks) before submitting a formal change request to the Change Control Board for approval.",
    difficulty: "Advanced" as const,
    domain: "Project Integration Management",
    order: 1,
    subjectSlug: "pmp-certification",
    examSlug: "pmp-advanced-simulation"
  },
  {
    text: "During project execution, a key team member informs you that a critical deliverable will be delayed by two weeks due to technical challenges. The project is currently on the critical path. What is the BEST course of action?",
    options: [
      "Accept the delay and update the project schedule",
      "Crash the schedule by adding more resources",
      "Fast-track other activities to make up time",
      "Analyze alternatives including crashing, fast-tracking, and scope reduction"
    ],
    correctAnswer: 3,
    allowMultipleAnswers: false,
    explanation: "When facing schedule delays on the critical path, the project manager should analyze all available options including crashing (adding resources), fast-tracking (parallel execution), scope reduction, or schedule compression techniques. A comprehensive analysis helps determine the most cost-effective solution.",
    difficulty: "Advanced",
    domain: "Project Schedule Management",
    order: 2,
    subjectSlug: "pmp-certification",
    examSlug: "pmp-advanced-simulation"
  },

  // AWS Cloud Practitioner Questions
  {
    text: "Which AWS service provides a managed NoSQL database that can automatically scale based on application demand?",
    options: [
      "Amazon RDS",
      "Amazon DynamoDB",
      "Amazon Redshift",
      "Amazon Aurora"
    ],
    correctAnswer: 1,
    allowMultipleAnswers: false,
    explanation: "Amazon DynamoDB is a fully managed NoSQL database service that provides fast and predictable performance with seamless scalability. It automatically scales tables up and down to adjust for capacity and maintains performance with zero administration.",
    difficulty: "Beginner",
    domain: "Database Services",
    order: 1,
    subjectSlug: "aws-cloud-practitioner",
    examSlug: "aws-cloud-practitioner-fundamentals"
  },
  {
    text: "What is the primary benefit of using AWS Auto Scaling?",
    options: [
      "Reduces network latency",
      "Automatically adjusts compute capacity based on demand",
      "Provides data backup and recovery",
      "Encrypts data in transit"
    ],
    correctAnswer: 1,
    allowMultipleAnswers: false,
    explanation: "AWS Auto Scaling monitors applications and automatically adjusts capacity to maintain steady, predictable performance at the lowest possible cost. It can scale Amazon EC2 instances up or down according to conditions you define.",
    difficulty: "Beginner",
    domain: "Compute Services",
    order: 2,
    subjectSlug: "aws-cloud-practitioner",
    examSlug: "aws-cloud-practitioner-fundamentals"
  },

  // Azure Fundamentals Questions
  {
    text: "Which Azure service category includes virtual machines, containers, and serverless computing?",
    options: [
      "Storage",
      "Networking",
      "Compute",
      "Database"
    ],
    correctAnswer: 2,
    allowMultipleAnswers: false,
    explanation: "Compute services in Azure include virtual machines (Azure Virtual Machines), containers (Azure Container Instances, Azure Kubernetes Service), and serverless computing (Azure Functions, Azure Logic Apps).",
    difficulty: "Beginner",
    domain: "Azure Core Services",
    order: 1,
    subjectSlug: "azure-fundamentals",
    examSlug: "azure-fundamentals-az900"
  },

  // CompTIA Security+ Questions
  {
    text: "Which type of attack involves an attacker intercepting and potentially altering communications between two parties who believe they are communicating directly with each other?",
    options: [
      "Denial of Service (DoS)",
      "Man-in-the-Middle (MitM)",
      "SQL Injection",
      "Cross-Site Scripting (XSS)"
    ],
    correctAnswer: 1,
    allowMultipleAnswers: false,
    explanation: "A Man-in-the-Middle (MitM) attack occurs when an attacker secretly intercepts and potentially alters communications between two parties who believe they are communicating directly. This can lead to data theft, session hijacking, or credential theft.",
    difficulty: "Intermediate",
    domain: "Threats and Vulnerabilities",
    order: 1,
    subjectSlug: "comptia-security-plus",
    examSlug: "comptia-security-plus-practice"
  },

  // Google Cloud Platform Questions
  {
    text: "Which Google Cloud service is best suited for running containerized applications with automatic scaling and management?",
    options: [
      "Compute Engine",
      "App Engine",
      "Google Kubernetes Engine (GKE)",
      "Cloud Functions"
    ],
    correctAnswer: 2,
    allowMultipleAnswers: false,
    explanation: "Google Kubernetes Engine (GKE) is a managed Kubernetes service that provides automatic scaling, management, and orchestration for containerized applications. It handles the complexity of Kubernetes while providing enterprise-grade security and reliability.",
    difficulty: "Intermediate",
    domain: "Compute and Containers",
    order: 1,
    subjectSlug: "gcp-cloud-engineer",
    examSlug: "gcp-associate-cloud-engineer"
  },

  // Scrum Questions
  {
    text: "What is the maximum recommended duration for a Sprint in Scrum?",
    options: [
      "2 weeks",
      "4 weeks",
      "6 weeks",
      "8 weeks"
    ],
    correctAnswer: 1,
    allowMultipleAnswers: false,
    explanation: "According to the Scrum Guide, Sprints have a maximum duration of one month (4 weeks). Shorter Sprints can be employed to generate more learning cycles and limit risk of cost and effort to a smaller time frame.",
    difficulty: "Beginner",
    domain: "Scrum Events",
    order: 1,
    subjectSlug: "csm-certification",
    examSlug: "csm-scrum-fundamentals"
  },

  // Additional comprehensive questions for better coverage
  {
    text: "In project risk management, what is the difference between a risk and an issue?",
    options: [
      "There is no difference; they are the same thing",
      "A risk is something that might happen; an issue is something that has happened",
      "A risk affects schedule; an issue affects budget",
      "A risk is positive; an issue is negative"
    ],
    correctAnswer: 1,
    allowMultipleAnswers: false,
    explanation: "A risk is an uncertain event that, if it occurs, has a positive or negative effect on project objectives. An issue is a current problem that is impacting or will impact the project and requires immediate attention and resolution.",
    difficulty: "Intermediate",
    domain: "Project Risk Management",
    order: 3,
    subjectSlug: "pmp-certification",
    examSlug: "pmp-fundamentals-exam"
  },

  {
    text: "Which AWS pricing model allows you to pay for compute capacity by the hour or second with no long-term commitments?",
    options: [
      "Reserved Instances",
      "Spot Instances",
      "On-Demand Instances",
      "Dedicated Hosts"
    ],
    correctAnswer: 2,
    allowMultipleAnswers: false,
    explanation: "On-Demand Instances let you pay for compute capacity by the hour or second (minimum 60 seconds) with no long-term commitments. This eliminates the costs and complexities of planning, purchasing, and maintaining hardware.",
    difficulty: "Beginner",
    domain: "AWS Pricing",
    order: 3,
    subjectSlug: "aws-cloud-practitioner",
    examSlug: "aws-cloud-practitioner-fundamentals"
  },

  {
    text: "What is the principle of least privilege in cybersecurity?",
    options: [
      "Users should have the maximum access rights needed for any potential task",
      "Users should only have the minimum access rights needed to perform their job functions",
      "All users should have equal access rights",
      "Access rights should be granted based on seniority"
    ],
    correctAnswer: 1,
    allowMultipleAnswers: false,
    explanation: "The principle of least privilege is a security concept where users are given the minimum levels of access rights needed to perform their job functions. This reduces the attack surface and limits potential damage from compromised accounts.",
    difficulty: "Intermediate",
    domain: "Security Principles",
    order: 2,
    subjectSlug: "comptia-security-plus",
    examSlug: "comptia-security-plus-practice"
  }
];

// Sample user interaction data for trending
const userInteractions = [
  { subjectSlug: 'pmp-certification', interactionType: 'exam_started', count: 45 },
  { subjectSlug: 'aws-cloud-practitioner', interactionType: 'exam_started', count: 38 },
  { subjectSlug: 'comptia-security-plus', interactionType: 'exam_started', count: 32 },
  { subjectSlug: 'azure-fundamentals', interactionType: 'exam_started', count: 28 },
  { subjectSlug: 'csm-certification', interactionType: 'exam_started', count: 22 },
  { subjectSlug: 'aws-solutions-architect', interactionType: 'exam_started', count: 20 },
  { subjectSlug: 'gcp-cloud-engineer', interactionType: 'exam_started', count: 18 },
  { subjectSlug: 'ccna-certification', interactionType: 'exam_started', count: 15 }
];

async function seedDatabase() {
  try {
    console.log('🗂️  Seeding categories...');
    await db.insert(schema.categories).values(categories).onConflictDoNothing();
    
    console.log('📁 Seeding subcategories...');
    await db.insert(schema.subcategories).values(subcategories).onConflictDoNothing();
    
    console.log('📚 Seeding subjects...');
    await db.insert(schema.subjects).values(subjects).onConflictDoNothing();
    
    console.log('📝 Seeding exams...');
    await db.insert(schema.exams).values(exams).onConflictDoNothing();
    
    console.log('❓ Seeding questions...');
    await db.insert(schema.questions).values(questions).onConflictDoNothing();
    
    console.log('📊 Seeding user interactions for trending...');
    const interactionData = userInteractions.map(interaction => ({
      subjectSlug: interaction.subjectSlug,
      interactionType: interaction.interactionType,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random timestamp within last 7 days
      metadata: { count: interaction.count }
    }));
    
    await db.insert(schema.userSubjectInteractions).values(interactionData).onConflictDoNothing();
    
    // Update subject counts
    console.log('🔢 Updating subject exam and question counts...');
    await sql`
      UPDATE subjects 
      SET exam_count = (
        SELECT COUNT(*) 
        FROM exams 
        WHERE exams.subject_slug = subjects.slug AND exams.is_active = true
      ),
      question_count = (
        SELECT COUNT(*) 
        FROM questions 
        WHERE questions.subject_slug = subjects.slug
      )
    `;
    
    // Create trending snapshot
    console.log('📈 Creating trending snapshot...');
    const trendingData = userInteractions.slice(0, 5).map((interaction, index) => ({
      slug: interaction.subjectSlug,
      name: subjects.find(s => s.slug === interaction.subjectSlug)?.name || 'Unknown',
      growthPercentage: Math.floor(Math.random() * 25) + 10 // 10-35% growth
    }));
    
    await db.insert(schema.dailyTrendingSnapshot).values([{
      date: new Date(),
      topSubjects: trendingData
    }]).onConflictDoNothing();
    
    console.log('✅ Database seeding completed successfully!');
    
    // Summary
    const counts = await Promise.all([
      db.select().from(schema.categories),
      db.select().from(schema.subcategories),
      db.select().from(schema.subjects),
      db.select().from(schema.exams),
      db.select().from(schema.questions)
    ]);
    
    console.log('\n📊 Seeding Summary:');
    console.log(`   Categories: ${counts[0].length}`);
    console.log(`   Subcategories: ${counts[1].length}`);
    console.log(`   Subjects: ${counts[2].length}`);
    console.log(`   Exams: ${counts[3].length}`);
    console.log(`   Questions: ${counts[4].length}`);
    
    console.log('\n🎯 Top Certification Areas:');
    console.log('   • Project Management (PMP, CAPM, Scrum)');
    console.log('   • Cloud Computing (AWS, Azure, GCP)');
    console.log('   • Cybersecurity (Security+, CISSP, CISA)');
    console.log('   • IT Infrastructure (Network+, CCNA)');
    console.log('   • Data Analytics & Business Analysis');
    
    console.log('\n🚀 Ready for Vercel deployment!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase().then(() => {
  console.log('🎉 Production database seeding complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal seeding error:', error);
  process.exit(1);
});