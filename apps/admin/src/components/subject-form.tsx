'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  EntityForm,
  EntityFormActions,
  FormField,
  FormLabel,
  FormSection,
  Input,
  SearchableSelect,
  Textarea,
  type SearchableSelectOption,
} from '@brainliest/ui';
import { useFormState, useFormStatus } from 'react-dom';
import type { SubjectFormState } from '@/app/(panel)/taxonomy/actions';
import { subjectFormInitialState } from '@/app/(panel)/taxonomy/actions';

const difficultyOptions: SearchableSelectOption[] = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'EXPERT', label: 'Expert' },
];

interface SubjectFormValues {
  slug: string;
  categorySlug: string;
  subcategorySlug?: string;
  name: string;
  description?: string;
  icon?: string;
  difficulty?: string;
  tags?: string;
  metadata?: string;
  active: boolean;
}

export interface SubjectFormProps {
  readonly action: (state: SubjectFormState, formData: FormData) => Promise<SubjectFormState>;
  readonly categories: ReadonlyArray<SearchableSelectOption>;
  readonly subcategoriesByCategory: Readonly<Record<string, ReadonlyArray<SearchableSelectOption>>>;
  readonly defaultValues?: Partial<SubjectFormValues>;
  readonly submitLabel?: string;
  readonly headline?: string;
  readonly description?: string;
}

function FormSubmitActions({ submitLabel }: { submitLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <EntityFormActions>
      <Button type="submit" isLoading={pending} disabled={pending}>
        {submitLabel}
      </Button>
    </EntityFormActions>
  );
}

function normaliseDefaults(defaults?: Partial<SubjectFormValues>): SubjectFormValues {
  return {
    slug: defaults?.slug ?? '',
    categorySlug: defaults?.categorySlug ?? '',
    subcategorySlug: defaults?.subcategorySlug ?? undefined,
    name: defaults?.name ?? '',
    description: defaults?.description ?? '',
    icon: defaults?.icon ?? '',
    difficulty: defaults?.difficulty ?? '',
    tags: defaults?.tags ?? '',
    metadata: defaults?.metadata ?? '',
    active: defaults?.active ?? true,
  };
}

export function SubjectForm({
  action,
  categories,
  subcategoriesByCategory,
  defaultValues,
  submitLabel = 'Save subject',
  headline = 'Subject details',
  description = 'Connect the subject to taxonomy and configure discovery metadata.',
}: SubjectFormProps) {
  const hydratedDefaults = useMemo(() => normaliseDefaults(defaultValues), [defaultValues]);
  const [formState, formAction] = useFormState(action, subjectFormInitialState);
  const [values, setValues] = useState<SubjectFormValues>(hydratedDefaults);

  useEffect(() => {
    setValues(hydratedDefaults);
  }, [hydratedDefaults]);

  const fieldErrors = formState.fieldErrors ?? {};
  const availableSubcategories = values.categorySlug
    ? subcategoriesByCategory[values.categorySlug] ?? []
    : [];

  return (
    <EntityForm
      action={formAction}
      title={headline}
      description={description}
      footer={<FormSubmitActions submitLabel={submitLabel} />}
    >
      <input type="hidden" name="categorySlug" value={values.categorySlug} />
      <input type="hidden" name="subcategorySlug" value={values.subcategorySlug ?? ''} />
      <input type="hidden" name="difficulty" value={values.difficulty ?? ''} />
      <input type="hidden" name="active" value={values.active ? 'true' : 'false'} />

      {formState.status === 'error' && formState.message ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800">
          {formState.message}
        </div>
      ) : null}

      {formState.status === 'success' && formState.message ? (
        <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-900">
          {formState.message}
        </div>
      ) : null}

      <FormSection title="Basics" description="Set identifiers and taxonomy relationships.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField error={fieldErrors.slug}>
            <FormLabel>Slug</FormLabel>
            <Input
              name="slug"
              value={values.slug}
              onChange={(event) => setValues((previous) => ({ ...previous, slug: event.target.value }))}
              placeholder="e.g. algebra-ii"
              disabled={Boolean(defaultValues?.slug)}
              required
            />
          </FormField>

          <FormField error={fieldErrors.name}>
            <FormLabel>Name</FormLabel>
            <Input
              name="name"
              value={values.name}
              onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Subject name"
              required
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField error={fieldErrors.categorySlug}>
            <FormLabel>Category</FormLabel>
            <SearchableSelect
              options={categories}
              value={values.categorySlug}
              onChange={(categorySlug) =>
                setValues((previous) => ({ ...previous, categorySlug, subcategorySlug: undefined }))
              }
              placeholder="Select category"
            />
          </FormField>

          <FormField error={fieldErrors.subcategorySlug}>
            <FormLabel>Subcategory</FormLabel>
            <SearchableSelect
              options={availableSubcategories}
              value={values.subcategorySlug ?? ''}
              onChange={(subcategorySlug) => setValues((previous) => ({ ...previous, subcategorySlug }))}
              placeholder={values.categorySlug ? 'Select subcategory' : 'Choose a category first'}
              disabled={!values.categorySlug}
              emptyState={values.categorySlug ? 'No subcategories found' : 'Select a category'}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Metadata" description="Optional descriptive content and discoverability fields.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField error={fieldErrors.icon}>
            <FormLabel>Icon</FormLabel>
            <Input
              name="icon"
              value={values.icon ?? ''}
              onChange={(event) => setValues((previous) => ({ ...previous, icon: event.target.value }))}
              placeholder="Optional icon token"
            />
          </FormField>

          <FormField error={fieldErrors.difficulty}>
            <FormLabel>Difficulty</FormLabel>
            <SearchableSelect
              options={difficultyOptions}
              value={values.difficulty ?? ''}
              onChange={(difficulty) => setValues((previous) => ({ ...previous, difficulty }))}
              placeholder="Select difficulty"
            />
          </FormField>
        </div>

        <FormField error={fieldErrors.description}>
          <FormLabel>Description</FormLabel>
          <Textarea
            name="description"
            rows={4}
            value={values.description ?? ''}
            onChange={(event) => setValues((previous) => ({ ...previous, description: event.target.value }))}
            placeholder="Optional description"
          />
        </FormField>

        <FormField error={fieldErrors.tags}>
          <FormLabel>Tags</FormLabel>
          <Input
            name="tags"
            value={values.tags ?? ''}
            onChange={(event) => setValues((previous) => ({ ...previous, tags: event.target.value }))}
            placeholder="Comma-separated tags"
          />
        </FormField>

        <FormField error={fieldErrors.metadata}>
          <FormLabel>Metadata (JSON)</FormLabel>
          <Textarea
            name="metadata"
            rows={6}
            value={values.metadata ?? ''}
            onChange={(event) => setValues((previous) => ({ ...previous, metadata: event.target.value }))}
            placeholder={`{
  "focusAreas": []
}`}
          />
        </FormField>

        <FormField>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={values.active}
              onChange={(event) => setValues((previous) => ({ ...previous, active: event.target.checked }))}
            />
            Active
          </label>
        </FormField>
      </FormSection>
    </EntityForm>
  );
}
