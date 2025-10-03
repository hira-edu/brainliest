import { eq } from 'drizzle-orm';
import type { DatabaseClient } from '../client';
import * as schema from '../schema';

const CATEGORY_SLUG = 'math';
const SUBJECT_SLUG = 'algebra-ii';
const EXAM_SLUG = 'algebra-ii-midterm';
const TAG_SLUG = 'linear-equations';

export async function seedBaseData(db: DatabaseClient): Promise<void> {
  const existing = await db.select({ slug: schema.categories.slug }).from(schema.categories).limit(1);
  if (existing.length > 0) {
    console.log('Seed data already present, skipping.');
    return;
  }

  await db.transaction(async (tx) => {
    await tx.insert(schema.categories).values({
      slug: CATEGORY_SLUG,
      name: 'Mathematics',
      description: 'STEM coursework spanning foundational arithmetic to advanced calculus.',
      icon: 'Calculator',
      sortOrder: 1,
      type: 'academic',
    });

    await tx.insert(schema.subcategories).values({
      slug: 'algebra',
      categorySlug: CATEGORY_SLUG,
      name: 'Algebra',
      description: 'Linear equations, inequalities, and polynomial expressions.',
      sortOrder: 1,
    });

    await tx.insert(schema.subjects).values({
      slug: SUBJECT_SLUG,
      categorySlug: CATEGORY_SLUG,
      subcategorySlug: 'algebra',
      name: 'Algebra II',
      description: 'Quadratics, exponentials, logarithms, and complex numbers.',
      difficulty: 'MEDIUM',
      tags: ['quadratics', 'functions'],
    });

    await tx.insert(schema.exams).values({
      slug: EXAM_SLUG,
      subjectSlug: SUBJECT_SLUG,
      title: 'Algebra II Midterm',
      description: 'Assess mastery of unit one concepts.',
      durationMinutes: 90,
      questionTarget: 25,
      difficulty: 'MEDIUM',
      status: 'draft',
    });

    const [question] = await tx
      .insert(schema.questions)
      .values({
        subjectSlug: SUBJECT_SLUG,
        examSlug: EXAM_SLUG,
        type: 'single',
        difficulty: 'EASY',
        domain: 'algebra.linear-equations',
        source: 'Seed dataset',
        year: 2024,
        published: true,
      })
      .returning({ id: schema.questions.id });

    if (!question) {
      throw new Error('Failed to seed base question record.');
    }

    const [version] = await tx
      .insert(schema.questionVersions)
      .values({
        questionId: question.id,
        stemMarkdown: 'Solve for **x** in the equation `2x + 3 = 11`.',
        explanationMarkdown: 'Isolate the variable by subtracting 3 and dividing by 2.',
        isCurrent: true,
      })
      .returning({ id: schema.questionVersions.id });

    if (!version) {
      throw new Error('Failed to seed base question version.');
    }

    await tx
      .update(schema.questions)
      .set({ currentVersionId: version.id })
      .where(eq(schema.questions.id, question.id));

    await tx.insert(schema.choices).values([
      {
        questionVersionId: version.id,
        label: 'A',
        contentMarkdown: '`3`',
        isCorrect: false,
        sortOrder: 1,
      },
      {
        questionVersionId: version.id,
        label: 'B',
        contentMarkdown: '`4`',
        isCorrect: true,
        sortOrder: 2,
      },
      {
        questionVersionId: version.id,
        label: 'C',
        contentMarkdown: '`5`',
        isCorrect: false,
        sortOrder: 3,
      },
      {
        questionVersionId: version.id,
        label: 'D',
        contentMarkdown: '`8`',
        isCorrect: false,
        sortOrder: 4,
      },
    ]);

    const [tag] = await tx
      .insert(schema.tags)
      .values({ slug: TAG_SLUG, label: 'Linear Equations' })
      .onConflictDoNothing({ target: schema.tags.slug })
      .returning({ id: schema.tags.id });

    let tagId = tag?.id;
    if (!tagId) {
      const existingTag = await tx
        .select({ id: schema.tags.id })
        .from(schema.tags)
        .where(eq(schema.tags.slug, TAG_SLUG))
        .limit(1);
      tagId = existingTag[0]?.id;
    }

    if (tagId) {
      await tx
        .insert(schema.questionTags)
        .values({ questionId: question.id, tagId })
        .onConflictDoNothing();
    }
  });

  console.log('Seed data created successfully.');
}
