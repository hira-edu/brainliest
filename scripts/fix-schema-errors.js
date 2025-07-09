#!/usr/bin/env node
/**
 * Quick Schema Error Fixer
 * 
 * This script applies the fixes we know work for the current Drizzle TypeScript errors
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const schemaPath = path.join(process.cwd(), 'shared/schema.ts');

console.log('🔧 Applying known schema fixes...');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema file not found:', schemaPath);
  process.exit(1);
}

let content = fs.readFileSync(schemaPath, 'utf-8');

// List of problematic createInsertSchema calls that need the field exclusion syntax
const fixes = [
  {
    pattern: /export const insertCategorySchema = createInsertSchema\(categories\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertCategorySchema = createInsertSchema(categories, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});`
  },
  {
    pattern: /export const insertSubcategorySchema = createInsertSchema\(subcategories\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertSubcategorySchema = createInsertSchema(subcategories, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});`
  },
  {
    pattern: /export const insertSubjectSchema = createInsertSchema\(subjects\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertSubjectSchema = createInsertSchema(subjects, {
  examCount: undefined,
  questionCount: undefined,
  createdAt: undefined,
  updatedAt: undefined
});`
  },
  {
    pattern: /export const insertQuestionSchema = createInsertSchema\(questions\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertQuestionSchema = createInsertSchema(questions, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});`
  },
  {
    pattern: /export const insertExamSessionSchema = createInsertSchema\(examSessions\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertExamSessionSchema = createInsertSchema(examSessions, {
  id: undefined,
  createdAt: undefined,
  completedAt: undefined
});`
  },
  {
    pattern: /export const insertCommentSchema = createInsertSchema\(comments\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertCommentSchema = createInsertSchema(comments, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});`
  },
  {
    pattern: /export const insertUserSchema = createInsertSchema\(users\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertUserSchema = createInsertSchema(users, {
  id: undefined,
  isEmailVerified: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  lastLoginAt: undefined
});`
  },
  {
    pattern: /export const insertUserProfileSchema = createInsertSchema\(userProfiles\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertUserProfileSchema = createInsertSchema(userProfiles, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});`
  },
  {
    pattern: /export const insertDetailedAnswerSchema = createInsertSchema\(detailedAnswers\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertDetailedAnswerSchema = createInsertSchema(detailedAnswers, {
  id: undefined,
  submittedAt: undefined
});`
  },
  {
    pattern: /export const insertExamAnalyticsSchema = createInsertSchema\(examAnalytics\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertExamAnalyticsSchema = createInsertSchema(examAnalytics, {
  id: undefined,
  analyzedAt: undefined
});`
  },
  {
    pattern: /export const insertPerformanceTrendsSchema = createInsertSchema\(performanceTrends\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertPerformanceTrendsSchema = createInsertSchema(performanceTrends, {
  id: undefined,
  calculatedAt: undefined
});`
  },
  {
    pattern: /export const insertStudyRecommendationsSchema = createInsertSchema\(studyRecommendations\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertStudyRecommendationsSchema = createInsertSchema(studyRecommendations, {
  id: undefined,
  generatedAt: undefined
});`
  },
  {
    pattern: /export const insertAuthLogSchema = createInsertSchema\(authLogs\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertAuthLogSchema = createInsertSchema(authLogs, {
  id: undefined,
  timestamp: undefined
});`
  },
  {
    pattern: /export const insertAuthSessionSchema = createInsertSchema\(authSessions\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertAuthSessionSchema = createInsertSchema(authSessions, {
  id: undefined,
  createdAt: undefined,
  lastAccessedAt: undefined
});`
  },
  {
    pattern: /export const insertAuditLogSchema = createInsertSchema\(auditLogs\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertAuditLogSchema = createInsertSchema(auditLogs, {
  id: undefined,
  timestamp: undefined
});`
  },
  {
    pattern: /export const insertUserSubjectInteractionSchema = createInsertSchema\(userSubjectInteractions\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertUserSubjectInteractionSchema = createInsertSchema(userSubjectInteractions, {
  id: undefined,
  timestamp: undefined
});`
  },
  {
    pattern: /export const insertSubjectTrendingStatsSchema = createInsertSchema\(subjectTrendingStats\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertSubjectTrendingStatsSchema = createInsertSchema(subjectTrendingStats, {
  id: undefined,
  calculatedAt: undefined
});`
  },
  {
    pattern: /export const insertDailyTrendingSnapshotSchema = createInsertSchema\(dailyTrendingSnapshot\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertDailyTrendingSnapshotSchema = createInsertSchema(dailyTrendingSnapshot, {
  id: undefined,
  createdAt: undefined
});`
  },
  {
    pattern: /export const insertAnonQuestionSessionSchema = createInsertSchema\(anonQuestionSessions\)\.omit\(\{[^}]+\}\);/g,
    replacement: `export const insertAnonQuestionSessionSchema = createInsertSchema(anonQuestionSessions, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});`
  }
];

let changesMade = 0;

// Apply each fix
for (const fix of fixes) {
  if (fix.pattern.test(content)) {
    content = content.replace(fix.pattern, fix.replacement);
    changesMade++;
  }
}

if (changesMade > 0) {
  fs.writeFileSync(schemaPath, content, 'utf-8');
  console.log(`✅ Applied ${changesMade} schema fixes to shared/schema.ts`);
} else {
  console.log('ℹ️ No changes needed - schema is already using the correct syntax');
}

console.log('🚀 Running build test...');

// Test the build
try {
  execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() });
  console.log('✅ Build test passed!');
} catch (error) {
  console.log('❌ Build still has issues:');
  console.log(error.stdout?.toString() || error.message);
}