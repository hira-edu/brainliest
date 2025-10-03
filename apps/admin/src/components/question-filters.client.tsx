'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Input,
  SearchableSelect,
  type SearchableSelectOption,
  Stack,
} from '@brainliest/ui';
import type { HierarchicalTaxonomyData, HierarchyOption } from '@/types/taxonomy';
import type { QuestionFiltersInitialValues } from '@/types/filter-values';
import { FilterPanel } from './filter-panel';
import { hierarchyOptionToSelect, useTaxonomySelection } from './use-taxonomy-selection';

interface QuestionFiltersClientProps {
  readonly hierarchy: HierarchicalTaxonomyData;
  readonly initialFilters: QuestionFiltersInitialValues;
  readonly initialExamOptions: ReadonlyArray<HierarchyOption>;
}

interface FilterState {
  status: string;
  difficulty: string;
  categorySlug?: string;
  subcategorySlug?: string;
  subjectSlug?: string;
  examSlug?: string;
  search?: string;
}

interface QuestionSuggestion {
  value: string;
  label: string;
}

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';

interface QuestionSearchResponse {
  readonly suggestions?: ReadonlyArray<{ readonly id: string; readonly stem: string }>;
}

const extractQuestionSuggestions = (payload: unknown): QuestionSuggestion[] => {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const maybeSuggestions = (payload as QuestionSearchResponse).suggestions;
  if (!Array.isArray(maybeSuggestions)) {
    return [];
  }

  return maybeSuggestions
    .filter((item): item is { readonly id: string; readonly stem: string } =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { id?: unknown }).id === 'string' &&
      typeof (item as { stem?: unknown }).stem === 'string'
    )
    .map((item) => ({
      value: item.stem.slice(0, 80),
      label: item.id,
    }));
};

const STATUS_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'unpublished', label: 'Unpublished' },
];

const DIFFICULTY_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All difficulties' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'EXPERT', label: 'Expert' },
];

export default function QuestionFiltersClient({ hierarchy, initialFilters, initialExamOptions }: QuestionFiltersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialState: FilterState = {
    status: initialFilters.status && STATUS_OPTIONS.some((option) => option.value === initialFilters.status)
      ? initialFilters.status
      : 'all',
    difficulty: initialFilters.difficulty && DIFFICULTY_OPTIONS.some((option) => option.value === initialFilters.difficulty)
      ? initialFilters.difficulty
      : 'all',
    categorySlug: initialFilters.categorySlug,
    subcategorySlug: initialFilters.subcategorySlug,
    subjectSlug: initialFilters.subjectSlug,
    examSlug: initialFilters.examSlug,
    search: initialFilters.search?.trim() ? initialFilters.search.trim() : undefined,
  };

  const [filters, setFilters] = useState<FilterState>(initialState);
  const [searchInput, setSearchInput] = useState(initialState.search ?? '');
  const [suggestions, setSuggestions] = useState<QuestionSuggestion[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const datalistId = useId();

  const {
    categoryOptions: categoryHierarchyOptions,
    subcategoryOptions: subcategoryHierarchyOptions,
    subjectOptions: subjectHierarchyOptions,
    examOptions: examHierarchyOptions,
    isFetchingExams,
    handleCategoryChange,
    handleSubcategoryChange,
    handleSubjectChange,
    handleExamChange,
    resetSelection,
  } = useTaxonomySelection({
    hierarchy,
    filters,
    setFilters,
    initialExamOptions,
  });

  const categoryOptions = useMemo(
    () => categoryHierarchyOptions.map(hierarchyOptionToSelect),
    [categoryHierarchyOptions]
  );

  const subcategoryOptions = useMemo(
    () => subcategoryHierarchyOptions.map(hierarchyOptionToSelect),
    [subcategoryHierarchyOptions]
  );

  const subjectOptions = useMemo(
    () => subjectHierarchyOptions.map(hierarchyOptionToSelect),
    [subjectHierarchyOptions]
  );

  const mappedExamOptions = useMemo(
    () => examHierarchyOptions.map(hierarchyOptionToSelect),
    [examHierarchyOptions]
  );

  const pushFiltersToUrl = useCallback(
    (next: FilterState) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      const setParam = (key: string, value: string | undefined) => {
        if (value && value.length > 0 && value !== 'all') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      };

      setParam('status', next.status);
      setParam('difficulty', next.difficulty);
      setParam('category', next.categorySlug);
      setParam('subcategory', next.subcategorySlug);
      setParam('subject', next.subjectSlug);
      setParam('exam', next.examSlug);
      setParam('search', next.search);
      params.delete('page');

      const query = params.toString();
      router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters((previous) => ({ ...previous, ...updates }));
  }, []);

  const handleReset = useCallback(() => {
    setSearchInput('');
    setSuggestions([]);
    resetSelection();
    updateFilters({
      status: 'all',
      difficulty: 'all',
      search: undefined,
    });
  }, [resetSelection, updateFilters]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    const timeout = setTimeout(() => {
      updateFilters({ search: trimmed.length > 0 ? trimmed : undefined });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput, updateFilters]);

  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    startTransition(() => pushFiltersToUrl(filters));
  }, [filters, pushFiltersToUrl]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    fetch(`/api/search/questions?q=${encodeURIComponent(trimmed)}&limit=6`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load suggestions');
        }
        const payload: unknown = await response.json().catch(() => null);
        setSuggestions(extractQuestionSuggestions(payload));
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          console.error(error);
          setSuggestions([]);
        }
      });

    return () => controller.abort();
  }, [searchInput]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (filters.status && filters.status !== 'all') total += 1;
    if (filters.difficulty && filters.difficulty !== 'all') total += 1;
    if (filters.categorySlug) total += 1;
    if (filters.subcategorySlug) total += 1;
    if (filters.subjectSlug) total += 1;
    if (filters.examSlug) total += 1;
    if (filters.search) total += 1;
    return total;
  }, [filters]);

  return (
    <FilterPanel
      title="Filters"
      subtitle="Narrow the question inventory by taxonomy and lifecycle state."
      activeCount={activeFilterCount}
      onReset={handleReset}
      resetDisabled={isPending && activeFilterCount === 0}
    >
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Category</label>
          <SearchableSelect
            options={categoryOptions}
            value={filters.categorySlug}
            onChange={handleCategoryChange}
            placeholder="All categories"
            ariaLabel="Select category"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Subcategory</label>
          <SearchableSelect
            options={subcategoryOptions}
            value={filters.subcategorySlug}
            onChange={handleSubcategoryChange}
            placeholder={filters.categorySlug ? 'All subcategories' : 'Select a category first'}
            ariaLabel="Select subcategory"
            disabled={!filters.categorySlug || subcategoryOptions.length === 0}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Subject</label>
          <SearchableSelect
            options={subjectOptions}
            value={filters.subjectSlug}
            onChange={handleSubjectChange}
            placeholder={
              filters.categorySlug
                ? subjectOptions.length > 0
                  ? 'All subjects'
                  : 'No subjects available'
                : 'Select a category or subcategory'
            }
            ariaLabel="Select subject"
            disabled={(filters.categorySlug === undefined && filters.subcategorySlug === undefined) || subjectOptions.length === 0}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Exam</label>
          <SearchableSelect
            options={mappedExamOptions}
            value={filters.examSlug}
            onChange={handleExamChange}
            placeholder={filters.subjectSlug ? (isFetchingExams ? 'Loading exams…' : 'All exams') : 'Select a subject first'}
            ariaLabel="Select exam"
            disabled={!filters.subjectSlug || isFetchingExams || mappedExamOptions.length === 0}
          />
        </div>
      </div>

      <Stack direction="row" gap={3} className="flex-wrap">
        <div className="w-full max-w-xs space-y-2">
          <label className="text-xs font-medium text-gray-600">Status</label>
          <SearchableSelect
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(value) => updateFilters({ status: value })}
            placeholder="All statuses"
            ariaLabel="Select publication status"
          />
        </div>
        <div className="w-full max-w-xs space-y-2">
          <label className="text-xs font-medium text-gray-600">Difficulty</label>
          <SearchableSelect
            options={DIFFICULTY_OPTIONS}
            value={filters.difficulty}
            onChange={(value) => updateFilters({ difficulty: value })}
            placeholder="All difficulties"
            ariaLabel="Select difficulty"
          />
        </div>
        <div className="w-full max-w-md flex-1 space-y-2">
          <label className="text-xs font-medium text-gray-600">Search</label>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            placeholder="Search questions, subjects, or exams"
            list={datalistId}
          />
          <datalist id={datalistId}>
            {suggestions.map((suggestion) => (
              <option key={suggestion.label} value={suggestion.value} label={suggestion.label} />
            ))}
          </datalist>
        </div>
      </Stack>
    </FilterPanel>
  );
}
