'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SearchableSelectOption } from '@brainliest/ui';
import type { HierarchicalTaxonomyData, HierarchyOption, TaxonomySelectionState } from '@/types/taxonomy';

interface UseTaxonomySelectionArgs<T extends TaxonomySelectionState> {
  readonly hierarchy: HierarchicalTaxonomyData;
  readonly filters: T;
  readonly setFilters: React.Dispatch<React.SetStateAction<T>>;
  readonly initialExamOptions: ReadonlyArray<HierarchyOption>;
}

interface UseTaxonomySelectionResult {
  readonly selection: TaxonomySelectionState;
  readonly categoryOptions: ReadonlyArray<HierarchyOption>;
  readonly subcategoryOptions: ReadonlyArray<HierarchyOption>;
  readonly subjectOptions: ReadonlyArray<HierarchyOption>;
  readonly examOptions: ReadonlyArray<HierarchyOption>;
  readonly isFetchingExams: boolean;
  readonly handleCategoryChange: (value: string) => void;
  readonly handleSubcategoryChange: (value: string) => void;
  readonly handleSubjectChange: (value: string) => void;
  readonly handleExamChange: (value: string) => void;
  readonly resetSelection: () => void;
}

export function useTaxonomySelection<T extends TaxonomySelectionState>({
  hierarchy,
  filters,
  setFilters,
  initialExamOptions,
}: UseTaxonomySelectionArgs<T>): UseTaxonomySelectionResult {
  const [examOptions, setExamOptions] = useState<ReadonlyArray<HierarchyOption>>(initialExamOptions);
  const [isFetchingExams, setIsFetchingExams] = useState(false);

  const updateSelection = useCallback(
    (updates: Partial<TaxonomySelectionState>) => {
      setFilters((previous) => ({ ...previous, ...updates }) as T);
    },
    [setFilters]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      if (value === filters.categorySlug) {
        return;
      }
      setExamOptions([]);
      updateSelection({
        categorySlug: value,
        subcategorySlug: undefined,
        subjectSlug: undefined,
        examSlug: undefined,
      });
    },
    [filters.categorySlug, updateSelection]
  );

  const handleSubcategoryChange = useCallback(
    (value: string) => {
      if (value === filters.subcategorySlug) {
        return;
      }
      setExamOptions([]);
      updateSelection({
        subcategorySlug: value,
        subjectSlug: undefined,
        examSlug: undefined,
      });
    },
    [filters.subcategorySlug, updateSelection]
  );

  const handleSubjectChange = useCallback(
    (value: string) => {
      if (value === filters.subjectSlug) {
        return;
      }
      setExamOptions([]);
      updateSelection({
        subjectSlug: value,
        examSlug: undefined,
      });
    },
    [filters.subjectSlug, updateSelection]
  );

  const handleExamChange = useCallback(
    (value: string) => {
      updateSelection({ examSlug: value });
    },
    [updateSelection]
  );

  useEffect(() => {
    if (!filters.subjectSlug) {
      setExamOptions([]);
      return;
    }

    let cancelled = false;
    setIsFetchingExams(true);
    fetch(`/api/taxonomy/exams?subject=${encodeURIComponent(filters.subjectSlug)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load exams');
        }
        const payload = (await response.json()) as { options?: HierarchyOption[] };
        return payload.options ?? [];
      })
      .then((options) => {
        if (cancelled) {
          return;
        }
        setExamOptions(options);
        if (filters.examSlug && !options.some((option) => option.value === filters.examSlug)) {
          updateSelection({ examSlug: undefined });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExamOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetchingExams(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters.subjectSlug, filters.examSlug, updateSelection]);

  const categoryOptions = useMemo(
    () => hierarchy.categories,
    [hierarchy.categories]
  );

  const subcategoryOptions = useMemo(() => {
    if (!filters.categorySlug) {
      return [] as ReadonlyArray<HierarchyOption>;
    }
    return hierarchy.subcategoriesByCategory[filters.categorySlug] ?? [];
  }, [hierarchy.subcategoriesByCategory, filters.categorySlug]);

  const subjectOptions = useMemo(() => {
    if (filters.subcategorySlug) {
      return hierarchy.subjectsBySubcategory[filters.subcategorySlug] ?? [];
    }
    if (filters.categorySlug) {
      return hierarchy.uncategorisedSubjectsByCategory[filters.categorySlug] ?? [];
    }
    return [] as ReadonlyArray<HierarchyOption>;
  }, [
    hierarchy.subjectsBySubcategory,
    hierarchy.uncategorisedSubjectsByCategory,
    filters.subcategorySlug,
    filters.categorySlug,
  ]);

  const resetSelection = useCallback(() => {
    setExamOptions([]);
    updateSelection({
      categorySlug: undefined,
      subcategorySlug: undefined,
      subjectSlug: undefined,
      examSlug: undefined,
    });
  }, [updateSelection]);

  return {
    selection: {
      categorySlug: filters.categorySlug,
      subcategorySlug: filters.subcategorySlug,
      subjectSlug: filters.subjectSlug,
      examSlug: filters.examSlug,
    },
    categoryOptions,
    subcategoryOptions,
    subjectOptions,
    examOptions,
    isFetchingExams,
    handleCategoryChange,
    handleSubcategoryChange,
    handleSubjectChange,
    handleExamChange,
    resetSelection,
  } satisfies UseTaxonomySelectionResult;
}

export const hierarchyOptionToSelect = (option: HierarchyOption): SearchableSelectOption => ({
  value: option.value,
  label: option.label,
  description: option.description,
});
