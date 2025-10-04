'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  EntityForm,
  EntityFormActions,
  FormField,
  FormLabel,
  FormSection,
  Input,
  SearchableSelect,
  Stack,
  Textarea,
  type SearchableSelectOption,
} from '@brainliest/ui';
import { useFormState, useFormStatus } from 'react-dom';
import type { ExamFormState } from '@/app/(panel)/content/exams/actions';
import { examFormInitialState } from '@/app/(panel)/content/exams/actions';

interface ExamFormValues {
  slug: string;
  title: string;
  description?: string;
  subjectSlug: string;
  difficulty?: string;
  durationMinutes?: string;
  questionTarget?: string;
  status: string;
}

type SubmissionMode = 'page' | 'modal';

interface ExamFormProps {
  readonly action: (state: ExamFormState, formData: FormData) => Promise<ExamFormState>;
  readonly subjects: ReadonlyArray<SearchableSelectOption>;
  readonly defaultValues?: Partial<ExamFormValues>;
  readonly submitLabel?: string;
  readonly headline?: string;
  readonly description?: string;
  readonly formId?: string;
  readonly onSuccess?: (state: ExamFormState) => void;
  readonly submissionMode?: SubmissionMode;
}

const difficultyOptions: SearchableSelectOption[] = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'EXPERT', label: 'Expert' },
];

const statusOptions: SearchableSelectOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

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

function normaliseDefaults(defaults?: Partial<ExamFormValues>): ExamFormValues {
  const parsed: ExamFormValues = {
    slug: defaults?.slug ?? '',
    title: defaults?.title ?? '',
    description: defaults?.description ?? '',
    subjectSlug: defaults?.subjectSlug ?? '',
    difficulty: defaults?.difficulty ?? 'MEDIUM',
    durationMinutes:
      defaults?.durationMinutes !== undefined && defaults?.durationMinutes !== null
        ? String(defaults.durationMinutes)
        : undefined,
    questionTarget:
      defaults?.questionTarget !== undefined && defaults?.questionTarget !== null
        ? String(defaults.questionTarget)
        : undefined,
    status: defaults?.status ?? 'draft',
  };

  return parsed;
}

export function ExamForm({
  action,
  subjects,
  defaultValues,
  submitLabel = 'Save exam',
  headline = 'Exam details',
  description = 'Configure title, taxonomy, scheduling details, and publishing status.',
  formId,
  onSuccess,
  submissionMode = 'page',
}: ExamFormProps) {
  const hydratedDefaults = useMemo(() => normaliseDefaults(defaultValues), [defaultValues]);

  const [formState, formAction] = useFormState(action, examFormInitialState);
  const [values, setValues] = useState<ExamFormValues>(hydratedDefaults);
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

  const handleChange = useCallback(
    <K extends keyof ExamFormValues>(key: K, value: ExamFormValues[K]) => {
      setValues((previous) => ({
        ...previous,
        [key]: value,
      }));
    },
    []
  );

  const fieldErrors = formState.fieldErrors ?? {};

  const subjectsOptions = useMemo(() => subjects, [subjects]);

  return (
    <EntityForm
      action={formAction}
      title={headline}
      description={description}
      footer={<FormSubmitActions submitLabel={submitLabel} />}
      className="space-y-8"
      id={formId}
    >
      <input type="hidden" name="submissionMode" value={submissionMode} />
      <input type="hidden" name="subjectSlug" value={values.subjectSlug} />
      <input type="hidden" name="difficulty" value={values.difficulty ?? ''} />
      <input type="hidden" name="status" value={values.status} />

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

      <FormSection title="Identification" description="Set the slug, title, and subject scope for the exam.">
        <Stack gap={4}>
          <FormField error={fieldErrors.slug}>
            <FormLabel>Slug</FormLabel>
            <Input
              name="slug"
              value={values.slug}
              onChange={(event) => handleChange('slug', event.target.value)}
              placeholder="e.g. algebra-ii-midterm"
              disabled={Boolean(defaultValues?.slug)}
              required
            />
          </FormField>

          <FormField error={fieldErrors.title}>
            <FormLabel>Title</FormLabel>
            <Input
              name="title"
              value={values.title}
              onChange={(event) => handleChange('title', event.target.value)}
              placeholder="Exam title"
              required
            />
          </FormField>

          <FormField error={fieldErrors.description}>
            <FormLabel>Description</FormLabel>
            <Textarea
              name="description"
              value={values.description ?? ''}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="Short summary shown across catalog and practice surfaces"
              rows={4}
            />
          </FormField>
        </Stack>
      </FormSection>

      <FormSection title="Taxonomy & status" description="Attach the exam to a subject and set publication controls.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField error={fieldErrors.subjectSlug}>
            <FormLabel>Subject</FormLabel>
            <SearchableSelect
              options={subjectsOptions}
              value={values.subjectSlug}
              onChange={(subjectSlug) => handleChange('subjectSlug', subjectSlug)}
              placeholder="Select subject"
              emptyState="No subjects found"
            />
          </FormField>

          <FormField error={fieldErrors.difficulty}>
            <FormLabel>Difficulty</FormLabel>
            <SearchableSelect
              options={difficultyOptions}
              value={values.difficulty ?? ''}
              onChange={(difficulty) => handleChange('difficulty', difficulty)}
              placeholder="Select difficulty"
            />
          </FormField>

          <FormField error={fieldErrors.status}>
            <FormLabel>Status</FormLabel>
            <SearchableSelect
              options={statusOptions}
              value={values.status}
              onChange={(status) => handleChange('status', status)}
              placeholder="Select status"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Exam logistics" description="Optional metadata used for scheduling and pacing.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField error={fieldErrors.durationMinutes}>
            <FormLabel>Duration (minutes)</FormLabel>
            <Input
              name="durationMinutes"
              inputMode="numeric"
              value={values.durationMinutes ?? ''}
              onChange={(event) => handleChange('durationMinutes', event.target.value)}
              placeholder="e.g. 90"
            />
          </FormField>

          <FormField error={fieldErrors.questionTarget}>
            <FormLabel>Question target</FormLabel>
            <Input
              name="questionTarget"
              inputMode="numeric"
              value={values.questionTarget ?? ''}
              onChange={(event) => handleChange('questionTarget', event.target.value)}
              placeholder="Total number of questions"
            />
          </FormField>
        </div>
      </FormSection>
    </EntityForm>
  );
}
