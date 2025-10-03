import { eq } from 'drizzle-orm';
import { createDrizzleClient } from '../src/client';
import * as schema from '../src/schema';

async function main() {
  const db = createDrizzleClient();

  const examSlug = 'a-level-math';
  const subjectSlug = 'algebra-ii';

  const [existingExam] = await db
    .select({ slug: schema.exams.slug })
    .from(schema.exams)
    .where(eq(schema.exams.slug, examSlug))
    .limit(1);

  if (existingExam) {
    console.log(`Exam ${examSlug} already exists; skipping.`);
    return;
  }

  const [subject] = await db
    .select({ slug: schema.subjects.slug })
    .from(schema.subjects)
    .where(eq(schema.subjects.slug, subjectSlug))
    .limit(1);

  if (!subject) {
    throw new Error(`Subject ${subjectSlug} is missing; run the base seed first.`);
  }

  await db.transaction(async (tx) => {
    await tx.insert(schema.exams).values({
      slug: examSlug,
      subjectSlug,
      title: 'A-Level Mathematics Mock Paper',
      description: 'Timed practice session covering differentiation, integration, and applied mechanics.',
      durationMinutes: 60,
      questionTarget: 24,
      difficulty: 'MEDIUM',
      status: 'published',
      metadata: {
        tags: ['Timed', 'STEM', 'Adaptive'],
        passingScore: '75%',
        attemptsAllowed: 'Unlimited',
      },
    });

    const [question] = await tx
      .insert(schema.questions)
      .values({
        subjectSlug,
        examSlug,
        type: 'single',
        difficulty: 'EASY',
        domain: 'calculus.derivatives',
        source: 'Seed dataset',
        year: 2024,
        published: true,
      })
      .returning({ id: schema.questions.id });

    if (!question) {
      throw new Error('Failed to insert practice question');
    }

    const [version] = await tx
      .insert(schema.questionVersions)
      .values({
        questionId: question.id,
        stemMarkdown: 'What is the derivative of `f(x) = x^3`?',
        explanationMarkdown: 'Differentiate using the power rule: `f\'(x) = 3x^2`.',
        hasKatex: true,
        isCurrent: true,
      })
      .returning({ id: schema.questionVersions.id });

    if (!version) {
      throw new Error('Failed to insert practice question version');
    }

    await tx
      .update(schema.questions)
      .set({ currentVersionId: version.id })
      .where(eq(schema.questions.id, question.id));

    await tx.insert(schema.choices).values([
      {
        questionVersionId: version.id,
        label: 'A',
        contentMarkdown: '`3x^2`',
        isCorrect: true,
        sortOrder: 1,
      },
      {
        questionVersionId: version.id,
        label: 'B',
        contentMarkdown: '`x^3`',
        isCorrect: false,
        sortOrder: 2,
      },
      {
        questionVersionId: version.id,
        label: 'C',
        contentMarkdown: '`3x`',
        isCorrect: false,
        sortOrder: 3,
      },
      {
        questionVersionId: version.id,
        label: 'D',
        contentMarkdown: '`x^2`',
        isCorrect: false,
        sortOrder: 4,
      },
    ]);
  });

  console.log(`Seeded ${examSlug} exam and question.`);
}

main().catch((error) => {
  console.error('seed-a-level-math failed', error);
  process.exit(1);
});
