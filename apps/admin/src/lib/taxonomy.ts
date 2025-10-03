import 'server-only';

import type { CatalogCategorySummary } from '@brainliest/db';
import { repositories } from './repositories';

export async function listTaxonomyCategories(): Promise<CatalogCategorySummary[]> {
  return repositories.taxonomy.listCategoriesWithSubcategories();
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
