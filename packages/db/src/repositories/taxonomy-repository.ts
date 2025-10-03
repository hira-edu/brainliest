import { and, eq, isNotNull, sql } from 'drizzle-orm';
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
}

export interface CatalogCategorySummary {
  slug: string;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  subcategories: CatalogSubcategorySummary[];
}

export interface CatalogSubcategoryDetail {
  category: CatalogCategorySummary;
  subcategory: CatalogSubcategorySummary;
  exams: CatalogExamSummary[];
}

export interface TaxonomyRepository {
  listCategoriesWithSubcategories(): Promise<CatalogCategorySummary[]>;
  getCategoryWithSubcategories(slug: string): Promise<CatalogCategorySummary | null>;
  getSubcategoryDetail(categorySlug: string, subcategorySlug: string): Promise<CatalogSubcategoryDetail | null>;
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
      subcategories: category.subcategories.map((subcategory) => {
        const key = `${category.slug}|${subcategory.slug}`;
        const examCount = examCountMap.get(key) ?? 0;
        const focusAreas = focusAreaMap.get(key)?.slice(0, 6) ?? DEFAULT_FOCUS_AREAS;
        return {
          slug: subcategory.slug,
          name: subcategory.name,
          description: subcategory.description,
          icon: subcategory.icon,
          examCount,
          focusAreas,
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
      .orderBy((fields, { asc }) => asc(schema.exams.title));

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
}
