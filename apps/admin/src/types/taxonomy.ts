export interface HierarchyOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly badge?: string;
}

export interface HierarchicalTaxonomyData {
  readonly categories: ReadonlyArray<HierarchyOption>;
  readonly subcategoriesByCategory: Readonly<Record<string, ReadonlyArray<HierarchyOption>>>;
  readonly subjectsBySubcategory: Readonly<Record<string, ReadonlyArray<HierarchyOption>>>;
  readonly uncategorisedSubjectsByCategory: Readonly<Record<string, ReadonlyArray<HierarchyOption>>>;
}

export interface TaxonomySelectionState {
  readonly categorySlug?: string;
  readonly subcategorySlug?: string;
  readonly subjectSlug?: string;
  readonly examSlug?: string;
}
