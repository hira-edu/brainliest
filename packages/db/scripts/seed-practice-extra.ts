import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { createDrizzleClient } from '../src/client';
import * as schema from '../src/schema';

async function main() {
  const db = createDrizzleClient();
  const examSlug = 'algebra-ii-midterm';
  const subjectSlug = 'algebra-ii';

  const existingQuestions = await db
    .select({ id: schema.questions.id })
    .from(schema.questions)
    .where(eq(schema.questions.examSlug, examSlug));

  if (existingQuestions.length >= 2) {
    console.log('Exam already has multiple questions; skipping.');
    return;
  }

  const [question] = await db
    .insert(schema.questions)
    .values({
      subjectSlug,
      examSlug,
      type: 'single',
      difficulty: 'MEDIUM',
      domain: 'algebra.quadratics',
      source: 'Seed dataset',
      year: 2024,
      published: true,
    })
    .returning({ id: schema.questions.id });

  if (!question) {
    throw new Error('Failed to insert extra question');
  }

  const [version] = await db
    .insert(schema.questionVersions)
    .values({
      questionId: question.id,
      stemMarkdown: 'If `f(x) = x^2 - 4x + 3`, what is `f(3)`?',
      explanationMarkdown: 'Substitute `x = 3` into the polynomial: `9 - 12 + 3 = 0`.',
      hasKatex: true,
      isCurrent: true,
      createdAt: new Date(),
    })
    .returning({ id: schema.questionVersions.id });

  if (!version) {
    throw new Error('Failed to insert question version');
  }

  await db
    .update(schema.questions)
    .set({ currentVersionId: version.id })
    .where(eq(schema.questions.id, question.id));

  await db.insert(schema.choices).values([
    {
      questionVersionId: version.id,
      label: 'A',
      contentMarkdown: '`0`',
      isCorrect: true,
      sortOrder: 1,
    },
    {
      questionVersionId: version.id,
      label: 'B',
      contentMarkdown: '`1`',
      isCorrect: false,
      sortOrder: 2,
    },
    {
      questionVersionId: version.id,
      label: 'C',
      contentMarkdown: '`2`',
      isCorrect: false,
      sortOrder: 3,
    },
    {
      questionVersionId: version.id,
      label: 'D',
      contentMarkdown: '`3`',
      isCorrect: false,
      sortOrder: 4,
    },
  ]);

  console.log('Added extra practice question to exam.');
}

main().catch((error) => {
  console.error('Seed practice extra failed', error);
  process.exit(1);
});
