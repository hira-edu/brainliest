'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input, SearchableSelect, type SearchableSelectOption, Stack } from '@brainliest/ui';
import type { SubjectFiltersInitialValues } from '@/types/filter-values';
import type { HierarchicalTaxonomyData } from '@/types/taxonomy';
import { FilterPanel } from './filter-panel';
import { hierarchyOptionToSelect, useTaxonomySelection } from './use-taxonomy-selection';

interface SubjectFiltersClientProps {
  readonly hierarchy: HierarchicalTaxonomyData;
  readonly initialFilters: SubjectFiltersInitialValues;
}

const STATUS_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const DIFFICULTY_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All difficulties' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'EXPERT', label: 'Expert' },
];

const normalizeOption = (value: string | undefined, options: SearchableSelectOption[]): string => {
  const fallback = options[0]?.value ?? 'all';
  return value && options.some((option) => option.value === value) ? value : fallback;
};

export default function SubjectFiltersClient({ hierarchy, initialFilters }: SubjectFiltersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [taxonomyFilters, setTaxonomyFilters] = useState({
    categorySlug: initialFilters.categorySlug,
    subcategorySlug: initialFilters.subcategorySlug,
    subjectSlug: initialFilters.subjectSlug,
    examSlug: undefined as string | undefined,
  });

  const [filters, setFilters] = useState(() => ({
    difficulty: normalizeOption(initialFilters.difficulty, DIFFICULTY_OPTIONS),
    status: normalizeOption(initialFilters.status, STATUS_OPTIONS),
    search: initialFilters.search?.trim() ?? '',
  }));

  useEffect(() => {
    setTaxonomyFilters({
      categorySlug: initialFilters.categorySlug,
      subcategorySlug: initialFilters.subcategorySlug,
      subjectSlug: initialFilters.subjectSlug,
      examSlug: undefined,
    });
    setFilters({
      difficulty: normalizeOption(initialFilters.difficulty, DIFFICULTY_OPTIONS),
      status: normalizeOption(initialFilters.status, STATUS_OPTIONS),
      search: initialFilters.search?.trim() ?? '',
    });
  }, [initialFilters.categorySlug, initialFilters.subcategorySlug, initialFilters.subjectSlug, initialFilters.difficulty, initialFilters.status, initialFilters.search]);

  const {
    categoryOptions: categoryHierarchyOptions,
    subcategoryOptions: subcategoryHierarchyOptions,
    subjectOptions: subjectHierarchyOptions,
    handleCategoryChange,
    handleSubcategoryChange,
    handleSubjectChange,
    resetSelection,
  } = useTaxonomySelection({
    hierarchy,
    filters: taxonomyFilters,
    setFilters: setTaxonomyFilters,
    initialExamOptions: [],
  });

  const categoryOptions = useMemo(() => categoryHierarchyOptions.map(hierarchyOptionToSelect), [categoryHierarchyOptions]);
  const subcategoryOptions = useMemo(
    () => subcategoryHierarchyOptions.map(hierarchyOptionToSelect),
    [subcategoryHierarchyOptions]
  );
  const subjectOptions = useMemo(
    () => subjectHierarchyOptions.map(hierarchyOptionToSelect),
    [subjectHierarchyOptions]
  );

  const pushFiltersToUrl = useCallback(
    (overrides: Partial<SubjectFiltersInitialValues> = {}) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      const categoryValue = overrides.categorySlug ?? taxonomyFilters.categorySlug;
      const subcategoryValue = overrides.subcategorySlug ?? taxonomyFilters.subcategorySlug;
      const subjectValue = overrides.subjectSlug ?? taxonomyFilters.subjectSlug;
      const difficultyValue = overrides.difficulty ?? filters.difficulty;
      const statusValue = overrides.status ?? filters.status;
      const searchValue = overrides.search ?? filters.search;

      const setParam = (key: string, value: string | undefined) => {
        if (value && value !== 'all' && value.length > 0) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      };

      setParam('category', categoryValue);
      setParam('subcategory', subcategoryValue);
      setParam('subject', subjectValue);
      setParam('difficulty', difficultyValue);
      setParam('status', statusValue);

      const trimmedSearch = searchValue.trim();
      if (trimmedSearch.length > 0) {
        params.set('search', trimmedSearch);
      } else {
        params.delete('search');
      }

      params.delete('page');

      const query = params.toString();
      router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filters.difficulty, filters.search, filters.status, pathname, router, searchParams, taxonomyFilters.categorySlug, taxonomyFilters.subcategorySlug, taxonomyFilters.subjectSlug]
  );

  const updateDifficulty = useCallback(
    (value: string) => {
      setFilters((previous) => ({ ...previous, difficulty: value }));
      startTransition(() => pushFiltersToUrl({ difficulty: value }));
    },
    [pushFiltersToUrl]
  );

  const updateStatus = useCallback(
    (value: string) => {
      setFilters((previous) => ({ ...previous, status: value }));
      startTransition(() => pushFiltersToUrl({ status: value }));
    },
    [pushFiltersToUrl]
  );

  const handleSearchChange = useCallback((value: string) => {
    setFilters((previous) => ({ ...previous, search: value }));
  }, []);

  const taxonomyHandlers = useMemo(
    () => ({
      onCategoryChange: (value: string) => {
        handleCategoryChange(value);
        startTransition(() => pushFiltersToUrl({ categorySlug: value, subcategorySlug: undefined, subjectSlug: undefined }));
      },
      onSubcategoryChange: (value: string) => {
        handleSubcategoryChange(value);
        startTransition(() => pushFiltersToUrl({ subcategorySlug: value, subjectSlug: undefined }));
      },
      onSubjectChange: (value: string) => {
        handleSubjectChange(value);
        startTransition(() => pushFiltersToUrl({ subjectSlug: value }));
      },
      onResetSelection: () => {
        resetSelection();
        startTransition(() => pushFiltersToUrl({ categorySlug: undefined, subcategorySlug: undefined, subjectSlug: undefined }));
      },
    }),
    [handleCategoryChange, handleSubjectChange, handleSubcategoryChange, pushFiltersToUrl, resetSelection]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => pushFiltersToUrl({ search: filters.search }));
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters.search, pushFiltersToUrl]);

  const handleReset = useCallback(() => {
    taxonomyHandlers.onResetSelection();
    setFilters({ difficulty: 'all', status: 'all', search: '' });
    startTransition(() => pushFiltersToUrl({
      categorySlug: undefined,
      subcategorySlug: undefined,
      subjectSlug: undefined,
      difficulty: 'all',
      status: 'all',
      search: '',
    }));
  }, [pushFiltersToUrl, taxonomyHandlers]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (taxonomyFilters.categorySlug) total += 1;
    if (taxonomyFilters.subcategorySlug) total += 1;
    if (taxonomyFilters.subjectSlug) total += 1;
    if (filters.difficulty !== 'all') total += 1;
    if (filters.status !== 'all') total += 1;
    if (filters.search.trim().length > 0) total += 1;
    return total;
  }, [filters.difficulty, filters.search, filters.status, taxonomyFilters.categorySlug, taxonomyFilters.subjectSlug, taxonomyFilters.subcategorySlug]);

  return (
    <FilterPanel
      title="Filters"
      subtitle="Focus the subject catalog by taxonomy, difficulty, or status."
      activeCount={activeFilterCount}
      onReset={handleReset}
      resetDisabled={isPending && activeFilterCount === 0}
    >
      <div className="grid gap-3 xl:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Category</label>
          <SearchableSelect
            options={categoryOptions}
            value={taxonomyFilters.categorySlug}
            onChange={taxonomyHandlers.onCategoryChange}
            placeholder="All categories"
            ariaLabel="Filter by category"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Subcategory</label>
          <SearchableSelect
            options={subcategoryOptions}
            value={taxonomyFilters.subcategorySlug}
            onChange={taxonomyHandlers.onSubcategoryChange}
            placeholder={taxonomyFilters.categorySlug ? 'All subcategories' : 'Select a category first'}
            ariaLabel="Filter by subcategory"
            disabled={!taxonomyFilters.categorySlug || subcategoryOptions.length === 0}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Subject</label>
          <SearchableSelect
            options={subjectOptions}
            value={taxonomyFilters.subjectSlug}
            onChange={taxonomyHandlers.onSubjectChange}
            placeholder={
              taxonomyFilters.categorySlug
                ? subjectOptions.length > 0
                  ? 'All subjects'
                  : 'No subjects available'
                : 'Select a category or subcategory'
            }
            ariaLabel="Filter by subject"
            disabled={(taxonomyFilters.categorySlug === undefined && taxonomyFilters.subcategorySlug === undefined) || subjectOptions.length === 0}
          />
        </div>
      </div>

      <Stack direction="row" gap={3} className="flex-wrap">
        <div className="w-full max-w-xs space-y-2">
          <label className="text-xs font-medium text-gray-600">Difficulty</label>
          <SearchableSelect
            options={DIFFICULTY_OPTIONS}
            value={filters.difficulty}
            onChange={updateDifficulty}
            placeholder="All difficulties"
            ariaLabel="Filter by difficulty"
          />
        </div>
        <div className="w-full max-w-xs space-y-2">
          <label className="text-xs font-medium text-gray-600">Status</label>
          <SearchableSelect
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={updateStatus}
            placeholder="All statuses"
            ariaLabel="Filter by status"
          />
        </div>
        <div className="w-full flex-1 space-y-2">
          <label className="text-xs font-medium text-gray-600">Search</label>
          <Input
            value={filters.search}
            onChange={(event) => handleSearchChange(event.currentTarget.value)}
            placeholder="Search subjects"
            aria-label="Search subjects"
          />
        </div>
      </Stack>
    </FilterPanel>
  );
}
