/**
 * Icon Management Database Schema
 * Database-driven icon mapping system
 */

import { pgTable, text, varchar, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Icon registry table - stores all available icons
export const icons = pgTable('icons', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description'),
  keywords: text('keywords').array().default([]),
  filePath: varchar('file_path', { length: 500}),
  svgContent: text('svg_content'),
  brandColors: jsonb('brand_colors').default({}),
  variants: text('variants').array().default(['filled']),
  tags: text('tags').array().default([]),
  isOfficial: boolean('is_official').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow()
}, (table) => ({
  categoryIdx: index('icons_category_idx').on(table.category),
  activeIdx: index('icons_active_idx').on(table.isActive),
  keywordsIdx: index('icons_keywords_idx').on(table.keywords)
}));

// Subject-icon mapping table
export const subjectIconMappings = pgTable('subject_icon_mappings', {
  subjectSlug: varchar('subject_slug', { length: 255 }).notNull(),
  iconId: varchar('icon_id', { length: 100 }).notNull(),
  priority: varchar('priority', { length: 20 }).default('normal'), // 'high', 'normal', 'low'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow()
}, (table) => ({
  subjectIdx: index('subject_icon_subject_idx').on(table.subjectSlug),
  iconIdx: index('subject_icon_icon_idx').on(table.iconId),
  activeIdx: index('subject_icon_active_idx').on(table.isActive)
}));

// Exam-icon mapping table
export const examIconMappings = pgTable('exam_icon_mappings', {
  examSlug: varchar('exam_slug', { length: 255 }).notNull(),
  iconId: varchar('icon_id', { length: 100 }).notNull(),
  priority: varchar('priority', { length: 20 }).default('normal'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow()
}, (table) => ({
  examIdx: index('exam_icon_exam_idx').on(table.examSlug),
  iconIdx: index('exam_icon_icon_idx').on(table.iconId),
  activeIdx: index('exam_icon_active_idx').on(table.isActive)
}));

// Icon usage analytics
export const iconUsageAnalytics = pgTable('icon_usage_analytics', {
  iconId: varchar('icon_id', { length: 100 }).notNull(),
  usageType: varchar('usage_type', { length: 50 }).notNull(), // 'subject', 'exam', 'ui'
  entityId: varchar('entity_id', { length: 255 }).notNull(),
  viewCount: varchar('view_count').default('0'),
  lastUsed: timestamp('last_used', { mode: 'date' }).defaultNow(),
  metadata: jsonb('metadata').default({})
}, (table) => ({
  iconIdx: index('icon_usage_icon_idx').on(table.iconId),
  typeIdx: index('icon_usage_type_idx').on(table.usageType),
  lastUsedIdx: index('icon_usage_last_used_idx').on(table.lastUsed)
}));

// Schema validation
export const insertIconSchema = createInsertSchema(icons, {
  keywords: z.array(z.string()).default([]),
  variants: z.array(z.string()).default(['filled']),
  tags: z.array(z.string()).default([]),
  brandColors: z.record(z.string()).default({})
});

export const insertSubjectIconMappingSchema = createInsertSchema(subjectIconMappings);
export const insertExamIconMappingSchema = createInsertSchema(examIconMappings);
export const insertIconUsageAnalyticsSchema = createInsertSchema(iconUsageAnalytics);

// Types
export type Icon = typeof icons.$inferSelect;
export type InsertIcon = z.infer<typeof insertIconSchema>;
export type SubjectIconMapping = typeof subjectIconMappings.$inferSelect;
export type InsertSubjectIconMapping = z.infer<typeof insertSubjectIconMappingSchema>;
export type ExamIconMapping = typeof examIconMappings.$inferSelect;
export type InsertExamIconMapping = z.infer<typeof insertExamIconMappingSchema>;
export type IconUsageAnalytics = typeof iconUsageAnalytics.$inferSelect;
export type InsertIconUsageAnalytics = z.infer<typeof insertIconUsageAnalyticsSchema>;