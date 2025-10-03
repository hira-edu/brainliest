import { getTableColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
  categoryTypeEnum,
  examDifficultyEnum,
  examStatusEnum,
  questionTypeEnum,
  questions,
  examSessions,
} from './index';

describe('database schema', () => {
  it('defines category type enumeration', () => {
    expect(categoryTypeEnum.enumValues).toEqual(['academic', 'professional', 'standardized']);
  });

  it('exposes exam difficulty variants', () => {
    expect(examDifficultyEnum.enumValues).toEqual(['EASY', 'MEDIUM', 'HARD', 'EXPERT']);
  });

  it('enforces exam status states', () => {
    expect(examStatusEnum.enumValues).toEqual(['draft', 'published', 'archived']);
  });

  it('maps question table columns', () => {
    const columns = getTableColumns(questions);
    expect(Object.keys(columns)).toContain('subjectSlug');
    expect(columns.subjectSlug.name).toBe('subject_slug');
    expect(columns.published.default).toBe(false);
  });

  it('configures exam sessions with default state', () => {
    const columns = getTableColumns(examSessions);
    expect(columns.status.default).toBe('in_progress');
  });

  it('registers question type variants', () => {
    expect(questionTypeEnum.enumValues).toEqual(['single', 'multi']);
  });
});
