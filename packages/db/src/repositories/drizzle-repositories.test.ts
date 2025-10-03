import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { createRepositories } from './drizzle-repositories';
import { seedBaseData } from '../seeds/base-data';
import type { DatabaseClient } from '../client';
import * as schema from '../schema';
import type { ExamSlug, QuestionId, SubjectSlug } from '../types';

const migrationSql = readFileSync(
  resolve(__dirname, '../../migrations/202510020900_init.sql'),
  'utf8'
);

async function withTestContext<T>(handler: (context: {
  client: PGlite;
  db: ReturnType<typeof drizzle>;
  repositories: ReturnType<typeof createRepositories>;
}) => Promise<T>): Promise<T> {
  const client = new PGlite();
  try {
    await client.exec(`
      CREATE OR REPLACE FUNCTION gen_random_uuid()
      RETURNS uuid AS $$
      SELECT (
        lpad(to_hex((random() * 4294967295)::bigint), 8, '0') || '-' ||
        lpad(to_hex((random() * 65535)::bigint), 4, '0') || '-' ||
        lpad(to_hex((random() * 65535)::bigint), 4, '0') || '-' ||
        lpad(to_hex((random() * 65535)::bigint), 4, '0') || '-' ||
        lpad(to_hex((random() * 281474976710655)::bigint), 12, '0')
      )::uuid;
      $$ LANGUAGE SQL;
    `);

    const sanitizedSql = migrationSql.replace(
      /CREATE EXTENSION IF NOT EXISTS "pgcrypto";\s*/i,
      ''
    );

    await client.exec(sanitizedSql);
    const db = drizzle(client, { schema });

    await seedBaseData(db as unknown as DatabaseClient);
    const repositories = createRepositories(db as unknown as DatabaseClient);

    return await handler({ client, db, repositories });
  } finally {
    await client.close();
  }
}

describe('Drizzle repositories', () => {
  it('creates and retrieves questions with options and pagination', async () => {
    await withTestContext(async ({ repositories }) => {
      const questionId = await repositories.questions.create(
        {
          text: 'What is 3 + 5?',
          options: [
            { id: 'opt-1', label: 'A', contentMarkdown: '`6`' },
            { id: 'opt-2', label: 'B', contentMarkdown: '`8`' },
            { id: 'opt-3', label: 'C', contentMarkdown: '`10`' },
          ],
          correctAnswer: 1,
          allowMultiple: false,
          difficulty: 'EASY',
          explanation: 'Add three and five to get eight.',
          domain: 'arithmetic.addition',
          subjectSlug: 'algebra-ii' as SubjectSlug,
          examSlug: 'algebra-ii-midterm' as ExamSlug,
          source: 'unit-test',
          status: 'published',
        },
        'actor-1'
      );

      const fetched = await repositories.questions.findById(questionId);
      expect(fetched).not.toBeNull();
      expect(fetched?.options).toHaveLength(3);
      const correctLabels = fetched?.options.filter((option) => option.isCorrect).map((option) => option.label);
      expect(correctLabels).toEqual(['B']);
      expect(fetched?.published).toBe(true);

      const page = await repositories.questions.findByExam(
        'algebra-ii-midterm' as ExamSlug,
        { status: 'published' },
        1,
        10
      );

      expect(page.data.length).toBeGreaterThan(0);
      expect(page.pagination.totalCount).toBeGreaterThan(0);
    });
  });

  it('updates question text and choices', async () => {
    await withTestContext(async ({ repositories }) => {
      const questionId = await repositories.questions.create(
        {
          text: 'Select prime numbers',
          options: [
            { id: 'opt-a', label: 'A', contentMarkdown: '`4`', isCorrect: false },
            { id: 'opt-b', label: 'B', contentMarkdown: '`5`', isCorrect: true },
            { id: 'opt-c', label: 'C', contentMarkdown: '`7`', isCorrect: true },
          ],
          allowMultiple: true,
          correctAnswers: [1, 2],
          difficulty: 'MEDIUM',
          explanation: 'Only prime numbers should be selected.',
          domain: 'number-theory.primes',
          subjectSlug: 'algebra-ii' as SubjectSlug,
          examSlug: 'algebra-ii-midterm' as ExamSlug,
          source: 'unit-test',
          status: 'draft',
        },
        'actor-1'
      );

      await repositories.questions.update(
        {
          id: questionId,
          text: 'Select all prime numbers',
          options: [
            { id: 'opt-b', label: 'B', contentMarkdown: '`5`', isCorrect: true },
            { id: 'opt-c', label: 'C', contentMarkdown: '`7`', isCorrect: true },
            { id: 'opt-d', label: 'D', contentMarkdown: '`9`', isCorrect: false },
          ],
          correctAnswers: [0, 1],
          allowMultiple: true,
          status: 'published',
        },
        'actor-2'
      );

      const updated = await repositories.questions.findById(questionId);
      expect(updated?.stemMarkdown).toContain('prime numbers');
      expect(updated?.published).toBe(true);
      expect(updated?.options.map((option) => option.label)).toEqual(['B', 'C', 'D']);
      const updatedCorrect = updated?.options.filter((option) => option.isCorrect).map((option) => option.label);
      expect(updatedCorrect).toEqual(['B', 'C']);
    });
  });

  it('manages exam lifecycle', async () => {
    await withTestContext(async ({ repositories }) => {
      const slug = 'algebra-ii-final' as ExamSlug;
      await repositories.exams.create(
        {
          slug,
          subjectSlug: 'algebra-ii' as SubjectSlug,
          title: 'Algebra II Final',
          description: 'End of term comprehensive exam.',
          difficulty: 'HARD',
          durationMinutes: 120,
          questionTarget: 40,
          status: 'draft',
          metadata: { term: 'Spring' },
        },
        'actor-3'
      );

      const listed = await repositories.exams.list({ subjectSlug: 'algebra-ii' as SubjectSlug }, 1, 10);
      expect(listed.data.some((exam) => exam.slug === slug)).toBe(true);

      await repositories.exams.update(
        {
          slug,
          status: 'published',
          questionTarget: 45,
        },
        'actor-3'
      );

      const published = await repositories.exams.findBySlug(slug);
      expect(published?.status).toBe('published');
      expect(published?.questionTarget).toBe(45);
    });
  });

  it('handles user records and explanations', async () => {
    await withTestContext(async ({ repositories }) => {
      const userId = await repositories.users.create({
        email: 'student@example.com',
        hashedPassword: 'hashed-secret',
        role: 'STUDENT',
      });

      const user = await repositories.users.findByEmail('student@example.com');
      expect(user?.id).toBe(userId);
      expect(user?.role).toBe('STUDENT');

      const questionPage = await repositories.questions.findByExam(
        'algebra-ii-midterm' as ExamSlug,
        {},
        1,
        1
      );
      const targetQuestionId = questionPage.data[0]?.id as QuestionId;

      const targetQuestionVersionId = questionPage.data[0]?.currentVersionId as string;

      const explanationId = await repositories.explanations.create({
        questionId: targetQuestionId,
        questionVersionId: targetQuestionVersionId,
        answerPattern: 'choice-opt-2',
        content: 'Adding three and five equals eight.',
        model: 'gpt-4o-mini',
        language: 'en',
        tokensTotal: 128,
        costCents: 5,
      });

      const explanation = await repositories.explanations.findByQuestionAndPattern(
        targetQuestionId,
        'choice-opt-2'
      );

      expect(explanation?.id).toBe(explanationId);
      expect(explanation?.content).toContain('eight');

      for (let index = 0; index < 24; index += 1) {
        await repositories.explanations.create({
          questionId: targetQuestionId,
          questionVersionId: targetQuestionVersionId,
          answerPattern: `generated-${index}`,
          content: `Explanation content ${index}`,
          model: index % 2 === 0 ? 'gpt-4o-mini' : 'gpt-4.1-mini',
          language: 'en',
          tokensTotal: 64 + index,
          costCents: 4,
        });
      }

      const firstPage = await repositories.explanations.listRecent({ page: 1, pageSize: 10 });
      expect(firstPage.pagination.page).toBe(1);
      expect(firstPage.pagination.pageSize).toBe(10);
      expect(firstPage.pagination.totalCount).toBe(25);
      expect(firstPage.data.length).toBe(10);

      const thirdPage = await repositories.explanations.listRecent({ page: 3, pageSize: 10 });
      expect(thirdPage.pagination.page).toBe(3);
      expect(thirdPage.data.length).toBe(5);

      const aggregates = await repositories.explanations.getAggregateTotals();
      expect(aggregates.totalCount).toBe(25);
      expect(aggregates.tokensTotal).toBe(1940);
      expect(aggregates.costCentsTotal).toBe(101);

      const dailyTotals = await repositories.explanations.listDailyTotals({ days: 14 });
      expect(dailyTotals.length).toBeGreaterThan(0);
      const aggregateFromSeries = dailyTotals.reduce((sum, item) => sum + item.totalCount, 0);
      expect(aggregateFromSeries).toBe(aggregates.totalCount);
      expect(dailyTotals[dailyTotals.length - 1]?.tokensTotal ?? 0).toBeGreaterThan(0);
    });
  });

  it('creates and updates practice sessions', async () => {
    await withTestContext(async ({ repositories }) => {
      const userId = await repositories.users.create({
        email: 'practice-user@example.com',
        hashedPassword: 'secret-hash',
        role: 'STUDENT',
      });

      const sessionRecord = await repositories.sessions.startSession({
        userId,
        examSlug: 'algebra-ii-midterm' as ExamSlug,
      });

      expect(sessionRecord.examSlug).toBe('algebra-ii-midterm');
      expect(sessionRecord.questions.length).toBeGreaterThan(0);
      expect(sessionRecord.metadata.currentQuestionIndex).toBe(0);

      const firstQuestion = sessionRecord.questions[0]!;

      await repositories.sessions.recordQuestionProgress({
        sessionId: sessionRecord.id,
        questionId: firstQuestion.questionId,
        selectedAnswers: [1],
        timeSpentSeconds: 42,
      });

      await repositories.sessions.toggleFlag({
        sessionId: sessionRecord.id,
        questionId: firstQuestion.questionId,
        flagged: true,
      });

      await repositories.sessions.toggleBookmark({
        sessionId: sessionRecord.id,
        questionId: firstQuestion.questionId,
        bookmarked: true,
      });

      await repositories.sessions.updateRemainingSeconds({
        sessionId: sessionRecord.id,
        remainingSeconds: 1200,
      });

      await repositories.sessions.advanceQuestion({
        sessionId: sessionRecord.id,
        currentQuestionIndex: 1,
      });

      const updated = await repositories.sessions.getSession(sessionRecord.id);
      expect(updated).not.toBeNull();
      expect(updated?.metadata.currentQuestionIndex).toBe(1);
      expect(updated?.metadata.flaggedQuestionIds).toContain(firstQuestion.questionId);
      expect(updated?.metadata.bookmarkedQuestionIds).toContain(firstQuestion.questionId);
      expect(updated?.metadata.remainingSeconds).toBe(1200);

      const updatedQuestion = updated?.questions.find((item) => item.questionId === firstQuestion.questionId);
      expect(updatedQuestion?.selectedAnswers).toEqual([1]);
      expect(updatedQuestion?.timeSpentSeconds).toBe(42);
      expect(updatedQuestion?.isFlagged).toBe(true);
      expect(updatedQuestion?.isBookmarked).toBe(true);

      await repositories.sessions.toggleBookmark({
        sessionId: sessionRecord.id,
        questionId: firstQuestion.questionId,
        bookmarked: false,
      });

      const afterBookmarkRemoval = await repositories.sessions.getSession(sessionRecord.id);
      expect(afterBookmarkRemoval?.metadata.bookmarkedQuestionIds).not.toContain(firstQuestion.questionId);
      expect(
        afterBookmarkRemoval?.questions.find((item) => item.questionId === firstQuestion.questionId)?.isBookmarked
      ).toBe(false);
    });
  }, 20000);
});
