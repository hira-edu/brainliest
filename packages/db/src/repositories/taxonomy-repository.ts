import { and, eq, isNotNull, sql, asc } from 'drizzle-orm';
import type { DatabaseClient } from '../client';
import * as schema from '../schema';

export interface CatalogExamSummary {
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  questionTarget: number | null;
  passingScore?: string | null;
  tags: string[];
  difficultyMix?: string | null;
}

export interface CatalogSubcategorySummary {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  examCount: number;
  focusAreas: string[];
  subjectCount: number;
  sortOrder: number;
  active: boolean;
}

export interface CatalogCategorySummary {
  slug: string;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  subcategories: CatalogSubcategorySummary[];
  sortOrder: number;
  active: boolean;
}

export interface CatalogSubcategoryDetail {
  category: CatalogCategorySummary;
  subcategory: CatalogSubcategorySummary;
  exams: CatalogExamSummary[];
}

export interface CatalogSubcategoryAggregate {
  categorySlug: string;
  categoryName: string;
  categoryType: string;
  subcategorySlug: string;
  subcategoryName: string;
  description: string | null;
  icon: string | null;
  subjectCount: number;
  examCount: number;
  questionCount: number;
  focusAreas: string[];
}

export interface CatalogSubjectSummary {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  difficulty: string | null;
  active: boolean;
  categorySlug: string;
  categoryName: string;
  categoryType: string;
  subcategorySlug: string | null;
  subcategoryName: string | null;
  examCount: number;
  questionCount: number;
  tags: string[];
  focusAreas: string[];
  metadata: Record<string, unknown>;
}

type CategoryTypeValue = (typeof schema.categoryTypeEnum.enumValues)[number];

export interface CreateCategoryInput {
  slug: string;
  name: string;
  type: CategoryTypeValue;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  slug: string;
}

export interface CreateSubcategoryInput {
  slug: string;
  categorySlug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export interface UpdateSubcategoryInput extends Partial<CreateSubcategoryInput> {
  slug: string;
}

export interface CreateSubjectInput {
  slug: string;
  categorySlug: string;
  subcategorySlug?: string | null;
  name: string;
  description?: string | null;
  icon?: string | null;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
  active?: boolean;
}

export interface UpdateSubjectInput extends Partial<CreateSubjectInput> {
  slug: string;
}

export interface TaxonomyRepository {
  listCategoriesWithSubcategories(): Promise<CatalogCategorySummary[]>;
  getCategoryWithSubcategories(slug: string): Promise<CatalogCategorySummary | null>;
  getSubcategoryDetail(categorySlug: string, subcategorySlug: string): Promise<CatalogSubcategoryDetail | null>;
  listSubcategoryAggregates(): Promise<CatalogSubcategoryAggregate[]>;
  listSubjectSummaries(): Promise<CatalogSubjectSummary[]>;
  createCategory(input: CreateCategoryInput, actorId: string): Promise<string>;
  updateCategory(input: UpdateCategoryInput, actorId: string): Promise<void>;
  deleteCategory(slug: string, actorId: string): Promise<void>;
  createSubcategory(input: CreateSubcategoryInput, actorId: string): Promise<string>;
  updateSubcategory(input: UpdateSubcategoryInput, actorId: string): Promise<void>;
  deleteSubcategory(slug: string, actorId: string): Promise<void>;
  createSubject(input: CreateSubjectInput, actorId: string): Promise<string>;
  updateSubject(input: UpdateSubjectInput, actorId: string): Promise<void>;
  deleteSubject(slug: string, actorId: string): Promise<void>;
}

const DEFAULT_FOCUS_AREAS = ['Core concepts', 'Applied practice', 'Exam strategy'];

export class DrizzleTaxonomyRepository implements TaxonomyRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listCategoriesWithSubcategories(): Promise<CatalogCategorySummary[]> {
    const categories = await this.db.query.categories.findMany({
      where: eq(schema.categories.active, true),
      orderBy: (fields, { asc }) => asc(fields.sortOrder),
      with: {
        subcategories: {
          where: eq(schema.subcategories.active, true),
          orderBy: (fields, { asc }) => asc(fields.sortOrder),
        },
      },
    });

    const examCounts = await this.db
      .select({
        categorySlug: schema.subcategories.categorySlug,
        subcategorySlug: schema.subcategories.slug,
        examCount: sql<number>`count(${schema.exams.slug})`,
      })
      .from(schema.subcategories)
      .innerJoin(schema.categories, eq(schema.categories.slug, schema.subcategories.categorySlug))
      .leftJoin(schema.subjects, eq(schema.subjects.subcategorySlug, schema.subcategories.slug))
      .leftJoin(schema.exams, eq(schema.exams.subjectSlug, schema.subjects.slug))
      .where(and(eq(schema.categories.active, true), eq(schema.subcategories.active, true)))
      .groupBy(schema.subcategories.categorySlug, schema.subcategories.slug);

    const subjectCounts = await this.db
      .select({
        categorySlug: schema.subjects.categorySlug,
        subcategorySlug: schema.subjects.subcategorySlug,
        subjectCount: sql<number>`count(${schema.subjects.slug})`,
      })
      .from(schema.subjects)
      .where(and(eq(schema.subjects.active, true), isNotNull(schema.subjects.subcategorySlug)))
      .groupBy(schema.subjects.categorySlug, schema.subjects.subcategorySlug);

    const subcategoryFocusRows = await this.db
      .select({
        categorySlug: schema.subjects.categorySlug,
        subcategorySlug: schema.subjects.subcategorySlug,
        tags: schema.subjects.tags,
        metadata: schema.subjects.metadata,
      })
      .from(schema.subjects)
      .where(and(eq(schema.subjects.active, true), isNotNull(schema.subjects.subcategorySlug)));

    const examCountMap = new Map<string, number>();
    for (const row of examCounts) {
      if (!row.subcategorySlug) continue;
      examCountMap.set(`${row.categorySlug}|${row.subcategorySlug}`, Number(row.examCount ?? 0));
    }

    const subjectCountMap = new Map<string, number>();
    for (const row of subjectCounts) {
      if (!row.subcategorySlug) continue;
      subjectCountMap.set(`${row.categorySlug}|${row.subcategorySlug}`, Number(row.subjectCount ?? 0));
    }

    const focusAreaMap = new Map<string, string[]>();
    for (const row of subcategoryFocusRows) {
      if (!row.subcategorySlug) continue;
      const key = `${row.categorySlug}|${row.subcategorySlug}`;
      const existing = focusAreaMap.get(key) ?? [];
      const metadataFocus = Array.isArray(row.metadata?.focusAreas)
        ? row.metadata.focusAreas.filter((value): value is string => typeof value === 'string')
        : [];
      const tags = Array.isArray(row.tags) ? row.tags.filter((value): value is string => typeof value === 'string') : [];
      const combined = new Set([...existing, ...metadataFocus, ...tags]);
      focusAreaMap.set(key, Array.from(combined));
    }

    return categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      description: category.description,
      type: category.type,
      icon: category.icon,
      sortOrder: category.sortOrder ?? 0,
      active: category.active,
      subcategories: category.subcategories.map((subcategory) => {
        const key = `${category.slug}|${subcategory.slug}`;
        const examCount = examCountMap.get(key) ?? 0;
        const focusAreas = focusAreaMap.get(key)?.slice(0, 6) ?? DEFAULT_FOCUS_AREAS;
        const subjectCount = subjectCountMap.get(key) ?? 0;
        return {
          slug: subcategory.slug,
          name: subcategory.name,
          description: subcategory.description,
          icon: subcategory.icon,
          examCount,
          focusAreas,
          subjectCount,
          sortOrder: subcategory.sortOrder ?? 0,
          active: subcategory.active,
        } satisfies CatalogSubcategorySummary;
      }),
    }));
  }

  async getCategoryWithSubcategories(slug: string): Promise<CatalogCategorySummary | null> {
    const categories = await this.listCategoriesWithSubcategories();
    return categories.find((category) => category.slug === slug) ?? null;
  }

  async getSubcategoryDetail(categorySlug: string, subcategorySlug: string): Promise<CatalogSubcategoryDetail | null> {
    const categories = await this.listCategoriesWithSubcategories();
    const category = categories.find((item) => item.slug === categorySlug);
    if (!category) {
      return null;
    }
    const subcategory = category.subcategories.find((item) => item.slug === subcategorySlug);
    if (!subcategory) {
      return null;
    }

    const examRows = await this.db
      .select({
        exam: schema.exams,
        subjectSlug: schema.subjects.slug,
        subjectTags: schema.subjects.tags,
        subjectMetadata: schema.subjects.metadata,
      })
      .from(schema.exams)
      .innerJoin(schema.subjects, eq(schema.exams.subjectSlug, schema.subjects.slug))
      .where(and(
        eq(schema.subjects.categorySlug, categorySlug),
        eq(schema.subjects.subcategorySlug, subcategorySlug),
        eq(schema.exams.status, 'published')
      ))
      .orderBy(asc(schema.exams.title));

    const examSummaries: CatalogExamSummary[] = [];
    for (const row of examRows) {
      const metadata = row.exam.metadata ?? {};
      const passingScore = typeof metadata.passingScore === 'string' ? metadata.passingScore : null;
      const difficultyMix = typeof metadata.difficultyMix === 'string' ? metadata.difficultyMix : null;
      const tagsFromMetadata = Array.isArray(metadata.tags)
        ? metadata.tags.filter((value): value is string => typeof value === 'string')
        : [];
      const subjectTags = Array.isArray(row.subjectTags)
        ? row.subjectTags.filter((value): value is string => typeof value === 'string')
        : [];
      const tags = Array.from(new Set([...tagsFromMetadata, ...subjectTags]));

      examSummaries.push({
        slug: row.exam.slug,
        title: row.exam.title,
        description: row.exam.description,
        durationMinutes: row.exam.durationMinutes,
        questionTarget: row.exam.questionTarget,
        passingScore,
        difficultyMix,
        tags,
      });
    }

    return {
      category,
      subcategory,
      exams: examSummaries,
    };
  }

  async listSubcategoryAggregates(): Promise<CatalogSubcategoryAggregate[]> {
    const categories = await this.listCategoriesWithSubcategories();

    const questionCounts = await this.db
      .select({
        categorySlug: schema.subjects.categorySlug,
        subcategorySlug: schema.subjects.subcategorySlug,
        questionCount: sql<number>`count(${schema.questions.id})`,
      })
      .from(schema.subjects)
      .innerJoin(schema.questions, eq(schema.questions.subjectSlug, schema.subjects.slug))
      .where(and(eq(schema.subjects.active, true), isNotNull(schema.subjects.subcategorySlug)))
      .groupBy(schema.subjects.categorySlug, schema.subjects.subcategorySlug);

    const questionCountMap = new Map<string, number>();
    for (const row of questionCounts) {
      if (!row.subcategorySlug) continue;
      questionCountMap.set(`${row.categorySlug}|${row.subcategorySlug}`, Number(row.questionCount ?? 0));
    }

    return categories.flatMap((category) =>
      category.subcategories.map((subcategory) => {
        const key = `${category.slug}|${subcategory.slug}`;
        return {
          categorySlug: category.slug,
          categoryName: category.name,
          categoryType: category.type,
          subcategorySlug: subcategory.slug,
          subcategoryName: subcategory.name,
          description: subcategory.description,
          icon: subcategory.icon,
          subjectCount: subcategory.subjectCount,
          examCount: subcategory.examCount,
          questionCount: questionCountMap.get(key) ?? 0,
          focusAreas: subcategory.focusAreas,
        } satisfies CatalogSubcategoryAggregate;
      })
    );
  }

  async listSubjectSummaries(): Promise<CatalogSubjectSummary[]> {
    const [subjects, examCounts, questionCounts] = await Promise.all([
      this.db.query.subjects.findMany({
        with: {
          category: true,
          subcategory: true,
        },
      }),
      this.db
        .select({ subjectSlug: schema.exams.subjectSlug, examCount: sql<number>`count(${schema.exams.slug})` })
        .from(schema.exams)
        .groupBy(schema.exams.subjectSlug),
      this.db
        .select({ subjectSlug: schema.questions.subjectSlug, questionCount: sql<number>`count(${schema.questions.id})` })
        .from(schema.questions)
        .groupBy(schema.questions.subjectSlug),
    ]);

    const examCountMap = new Map<string, number>();
    for (const row of examCounts) {
      if (!row.subjectSlug) continue;
      examCountMap.set(row.subjectSlug, Number(row.examCount ?? 0));
    }

    const questionCountMap = new Map<string, number>();
    for (const row of questionCounts) {
      if (!row.subjectSlug) continue;
      questionCountMap.set(row.subjectSlug, Number(row.questionCount ?? 0));
    }

    const summaries: CatalogSubjectSummary[] = subjects.map((subject) => {
      const metadata = subject.metadata ?? {};
      const metadataFocus = Array.isArray(metadata.focusAreas)
        ? metadata.focusAreas.filter((value): value is string => typeof value === 'string')
        : [];
      const tags = Array.isArray(subject.tags)
        ? subject.tags.filter((value): value is string => typeof value === 'string')
        : [];
      const focusAreas = Array.from(new Set([...metadataFocus, ...tags]));

      return {
        slug: subject.slug,
        name: subject.name,
        description: subject.description,
        icon: subject.icon,
        difficulty: subject.difficulty ?? null,
        active: subject.active,
        categorySlug: subject.categorySlug,
        categoryName: subject.category?.name ?? subject.categorySlug,
        categoryType: subject.category?.type ?? 'UNKNOWN',
        subcategorySlug: subject.subcategorySlug ?? null,
        subcategoryName: subject.subcategory?.name ?? null,
        examCount: examCountMap.get(subject.slug) ?? 0,
        questionCount: questionCountMap.get(subject.slug) ?? 0,
        tags,
        focusAreas: focusAreas.slice(0, 8),
        metadata,
      };
    });

    summaries.sort((a, b) => {
      const categoryCompare = a.categoryName.localeCompare(b.categoryName, undefined, { sensitivity: 'base' });
      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      const subcategoryCompare = (a.subcategoryName ?? '').localeCompare(b.subcategoryName ?? '', undefined, {
        sensitivity: 'base',
      });
      if (subcategoryCompare !== 0) {
        return subcategoryCompare;
      }

      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return summaries;
  }

  async createCategory(input: CreateCategoryInput, actorId: string): Promise<string> {
    const [created] = await this.db
      .insert(schema.categories)
      .values({
        slug: input.slug,
        name: input.name,
        type: input.type,
        description: input.description ?? null,
        icon: input.icon ?? null,
        sortOrder: input.sortOrder ?? 0,
        active: input.active ?? true,
      })
      .returning({ slug: schema.categories.slug });

    if (!created) {
      throw new Error('Unable to insert category');
    }

    void actorId;
    return created.slug;
  }

  async updateCategory(input: UpdateCategoryInput, actorId: string): Promise<void> {
    const updates: Partial<typeof schema.categories.$inferInsert> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.type !== undefined) updates.type = input.type;
    if (input.description !== undefined) updates.description = input.description ?? null;
    if (input.icon !== undefined) updates.icon = input.icon ?? null;
    if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
    if (input.active !== undefined) updates.active = input.active;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await this.db.update(schema.categories).set(updates).where(eq(schema.categories.slug, input.slug));
    }

    void actorId;
  }

  async deleteCategory(slug: string, actorId: string): Promise<void> {
    await this.db.delete(schema.categories).where(eq(schema.categories.slug, slug));
    void actorId;
  }

  async createSubcategory(input: CreateSubcategoryInput, actorId: string): Promise<string> {
    const [created] = await this.db
      .insert(schema.subcategories)
      .values({
        slug: input.slug,
        categorySlug: input.categorySlug,
        name: input.name,
        description: input.description ?? null,
        icon: input.icon ?? null,
        sortOrder: input.sortOrder ?? 0,
        active: input.active ?? true,
      })
      .returning({ slug: schema.subcategories.slug });

    if (!created) {
      throw new Error('Unable to insert subcategory');
    }

    void actorId;
    return created.slug;
  }

  async updateSubcategory(input: UpdateSubcategoryInput, actorId: string): Promise<void> {
    const updates: Partial<typeof schema.subcategories.$inferInsert> = {};
    if (input.categorySlug !== undefined) updates.categorySlug = input.categorySlug;
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description ?? null;
    if (input.icon !== undefined) updates.icon = input.icon ?? null;
    if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
    if (input.active !== undefined) updates.active = input.active;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await this.db.update(schema.subcategories).set(updates).where(eq(schema.subcategories.slug, input.slug));
    }

    void actorId;
  }

  async deleteSubcategory(slug: string, actorId: string): Promise<void> {
    await this.db.delete(schema.subcategories).where(eq(schema.subcategories.slug, slug));
    void actorId;
  }

  async createSubject(input: CreateSubjectInput, actorId: string): Promise<string> {
    const [created] = await this.db
      .insert(schema.subjects)
      .values({
        slug: input.slug,
        categorySlug: input.categorySlug,
        subcategorySlug: input.subcategorySlug ?? null,
        name: input.name,
        description: input.description ?? null,
        icon: input.icon ?? null,
        difficulty: input.difficulty ?? null,
        tags: input.tags ?? [],
        metadata: input.metadata ?? {},
        active: input.active ?? true,
      })
      .returning({ slug: schema.subjects.slug });

    if (!created) {
      throw new Error('Unable to insert subject');
    }

    void actorId;
    return created.slug;
  }

  async updateSubject(input: UpdateSubjectInput, actorId: string): Promise<void> {
    const updates: Partial<typeof schema.subjects.$inferInsert> = {};
    if (input.categorySlug !== undefined) updates.categorySlug = input.categorySlug;
    if (input.subcategorySlug !== undefined) updates.subcategorySlug = input.subcategorySlug ?? null;
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description ?? null;
    if (input.icon !== undefined) updates.icon = input.icon ?? null;
    if (input.difficulty !== undefined) updates.difficulty = input.difficulty ?? null;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.metadata !== undefined) updates.metadata = input.metadata;
    if (input.active !== undefined) updates.active = input.active;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await this.db.update(schema.subjects).set(updates).where(eq(schema.subjects.slug, input.slug));
    }

    void actorId;
  }

  async deleteSubject(slug: string, actorId: string): Promise<void> {
    await this.db.delete(schema.subjects).where(eq(schema.subjects.slug, slug));
    void actorId;
  }
}
