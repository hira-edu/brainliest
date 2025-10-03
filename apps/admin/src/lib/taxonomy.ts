import 'server-only';

import type {
  CatalogCategorySummary,
  CatalogSubcategoryAggregate,
  CatalogSubjectSummary,
} from '@brainliest/db';
import { unstable_cache } from 'next/cache';
import { repositories } from './repositories';
import type { HierarchicalTaxonomyData, HierarchyOption } from '@/types/taxonomy';

export async function listTaxonomyCategories(): Promise<CatalogCategorySummary[]> {
  return repositories.taxonomy.listCategoriesWithSubcategories();
}

export async function listTaxonomySubcategories(): Promise<CatalogSubcategoryAggregate[]> {
  return repositories.taxonomy.listSubcategoryAggregates();
}

export async function listTaxonomySubjects(): Promise<CatalogSubjectSummary[]> {
  return repositories.taxonomy.listSubjectSummaries();
}

export function computeTaxonomyStats(categories: CatalogCategorySummary[]) {
  const categoryCount = categories.length;
  const subcategoryCount = categories.reduce((total, category) => total + category.subcategories.length, 0);
  const trackCount = subcategoryCount;
  const examCount = categories.reduce(
    (total, category) =>
      total + category.subcategories.reduce((subtotal, subcategory) => subtotal + subcategory.examCount, 0),
    0
  );

  return {
    categoryCount,
    subcategoryCount,
    trackCount,
    examCount,
  };
}

const formatCount = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

const loadHierarchicalData = unstable_cache(
  async (): Promise<HierarchicalTaxonomyData> => {
    const [categories, subjects] = await Promise.all([
      repositories.taxonomy.listCategoriesWithSubcategories(),
      repositories.taxonomy.listSubjectSummaries(),
    ]);

    const categoryOptions: HierarchyOption[] = categories
      .map((category) => ({
        value: category.slug,
        label: category.name,
        description: category.description ?? undefined,
        badge: formatCount(
          category.subcategories.reduce((total, item) => total + item.examCount, 0),
          'exam'
        ),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

    const subcategoriesByCategory: Record<string, HierarchyOption[]> = {};
    categories.forEach((category) => {
      subcategoriesByCategory[category.slug] = category.subcategories
        .map((subcategory) => ({
          value: subcategory.slug,
          label: subcategory.name,
          description: subcategory.description ?? undefined,
          badge: `${formatCount(subcategory.examCount, 'exam')} · ${formatCount(subcategory.subjectCount, 'subject')}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
    });

    const subjectsBySubcategory: Record<string, HierarchyOption[]> = {};
    const uncategorisedSubjectsByCategory: Record<string, HierarchyOption[]> = {};

    subjects.forEach((subject) => {
      const option: HierarchyOption = {
        value: subject.slug,
        label: subject.name,
        description: subject.description ?? undefined,
        badge: `${formatCount(subject.examCount, 'exam')} · ${formatCount(subject.questionCount, 'question')}`,
      };

      if (subject.subcategorySlug) {
        subjectsBySubcategory[subject.subcategorySlug] ??= [];
        subjectsBySubcategory[subject.subcategorySlug].push(option);
        return;
      }

      uncategorisedSubjectsByCategory[subject.categorySlug] ??= [];
      uncategorisedSubjectsByCategory[subject.categorySlug].push(option);
    });

    const sortByLabel = (options: HierarchyOption[]) =>
      options.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

    Object.values(subjectsBySubcategory).forEach(sortByLabel);
    Object.values(uncategorisedSubjectsByCategory).forEach(sortByLabel);

    return {
      categories: categoryOptions,
      subcategoriesByCategory,
      subjectsBySubcategory,
      uncategorisedSubjectsByCategory,
    } satisfies HierarchicalTaxonomyData;
  },
  ['admin-taxonomy-hierarchy'],
  { revalidate: 300 }
);

export async function getHierarchicalData(): Promise<HierarchicalTaxonomyData> {
  return loadHierarchicalData();
}

const loadExamsBySubject = unstable_cache(
  async (subjectSlug: string): Promise<HierarchyOption[]> => {
    const page = await repositories.exams.list({ subjectSlug }, 1, 200);
    return page.data
      .map((exam) => ({
        value: exam.slug,
        label: exam.title,
        description: exam.description ?? undefined,
        badge: exam.status === 'published' ? undefined : exam.status,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  },
  ['admin-taxonomy-exams-by-subject'],
  { revalidate: 300 }
);

export async function getExamsBySubject(subjectSlug: string): Promise<HierarchyOption[]> {
  if (!subjectSlug) {
    return [];
  }

  return loadExamsBySubject(subjectSlug);
}
