'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import type { SubcategoryFormState } from '@/app/(panel)/taxonomy/actions';
import { subcategoryFormInitialState } from '@/app/(panel)/taxonomy/actions';

interface SubcategoryFormValues {
  slug: string;
  categorySlug: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: string;
  active: boolean;
}

export interface SubcategoryFormProps {
  readonly action: (state: SubcategoryFormState, formData: FormData) => Promise<SubcategoryFormState>;
  readonly categories: ReadonlyArray<SearchableSelectOption>;
  readonly defaultValues?: Partial<SubcategoryFormValues>;
  readonly submitLabel?: string;
  readonly headline?: string;
  readonly description?: string;
  readonly formId?: string;
  readonly onSuccess?: (state: SubcategoryFormState) => void;
  readonly submissionMode?: 'page' | 'modal';
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

function normaliseDefaults(defaults?: Partial<SubcategoryFormValues>): SubcategoryFormValues {
  return {
    slug: defaults?.slug ?? '',
    categorySlug: defaults?.categorySlug ?? '',
    name: defaults?.name ?? '',
    description: defaults?.description ?? '',
    icon: defaults?.icon ?? '',
    sortOrder: defaults?.sortOrder ?? '',
    active: defaults?.active ?? true,
  };
}

export function SubcategoryForm({
  action,
  categories,
  defaultValues,
  submitLabel = 'Save subcategory',
  headline = 'Subcategory details',
  description = 'Attach the subcategory to a category and manage visibility.',
  formId,
  onSuccess,
  submissionMode = 'page',
}: SubcategoryFormProps) {
  const hydratedDefaults = useMemo(() => normaliseDefaults(defaultValues), [defaultValues]);
  const [formState, formAction] = useFormState(action, subcategoryFormInitialState);
  const [values, setValues] = useState<SubcategoryFormValues>(hydratedDefaults);
  const lastStatusRef = useRef(formState.status);

  useEffect(() => {
    setValues(hydratedDefaults);
  }, [hydratedDefaults]);

  useEffect(() => {
    if (formState.status === 'success' && lastStatusRef.current !== 'success') {
      onSuccess?.(formState);
    }
    lastStatusRef.current = formState.status;
  }, [formState, onSuccess]);

  const fieldErrors = formState.fieldErrors ?? {};

  return (
    <EntityForm
      action={formAction}
      title={headline}
      description={description}
      footer={<FormSubmitActions submitLabel={submitLabel} />}
      id={formId}
    >
      <input type="hidden" name="submissionMode" value={submissionMode} />
      <input type="hidden" name="categorySlug" value={values.categorySlug} />
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

      <FormSection title="Basics" description="Set identifiers and select the parent category.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField error={fieldErrors.slug}>
            <FormLabel>Slug</FormLabel>
            <Input
              name="slug"
              value={values.slug}
              onChange={(event) => setValues((previous) => ({ ...previous, slug: event.target.value }))}
              placeholder="e.g. networking"
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
              placeholder="Subcategory name"
              required
            />
          </FormField>
        </div>

        <FormField error={fieldErrors.categorySlug}>
          <FormLabel>Category</FormLabel>
          <SearchableSelect
            options={categories}
            value={values.categorySlug}
            onChange={(categorySlug) => setValues((previous) => ({ ...previous, categorySlug }))}
            placeholder="Select category"
          />
        </FormField>

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
      </FormSection>

      <FormSection title="Presentation" description="Icon, sort order, and status controls.">
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

          <FormField error={fieldErrors.sortOrder}>
            <FormLabel>Sort order</FormLabel>
            <Input
              name="sortOrder"
              inputMode="numeric"
              value={values.sortOrder ?? ''}
              onChange={(event) => setValues((previous) => ({ ...previous, sortOrder: event.target.value }))}
              placeholder="0"
            />
          </FormField>
        </div>

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
