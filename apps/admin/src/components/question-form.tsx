'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  Button,
  Checkbox,
  EntityForm,
  EntityFormActions,
  FormError,
  FormField,
  FormLabel,
  FormSection,
  Icon,
  Input,
  SearchableSelect,
  Stack,
  Textarea,
  type SearchableSelectOption,
} from '@brainliest/ui';
import { useFormState, useFormStatus } from 'react-dom';
import { questionFormInitialState, type QuestionFormState } from '@/app/(panel)/content/questions/actions';

interface QuestionOption {
  id: string;
  label: string;
  contentMarkdown: string;
  isCorrect: boolean;
}

interface QuestionFormValues {
  id?: string;
  text: string;
  explanation?: string;
  allowMultiple: boolean;
  difficulty: string;
  subjectSlug: string;
  examSlug?: string;
  domain?: string;
  source?: string;
  year?: number;
  status: string;
  options: QuestionOption[];
}

type SubmissionMode = 'page' | 'modal';

interface QuestionFormProps {
  readonly action: (state: QuestionFormState, formData: FormData) => Promise<QuestionFormState>;
  readonly subjects: ReadonlyArray<SearchableSelectOption>;
  readonly initialExamOptions?: ReadonlyArray<SearchableSelectOption>;
  readonly defaultValues?: Partial<QuestionFormValues>;
  readonly submitLabel?: string;
  readonly headline?: string;
  readonly description?: string;
  readonly formId?: string;
  readonly onSuccess?: (state: QuestionFormState) => void;
  readonly submissionMode?: SubmissionMode;
}

interface OptionEditorProps {
  option: QuestionOption;
  index: number;
  onChange: (index: number, field: keyof QuestionOption, value: string | boolean) => void;
  onRemove: (index: number) => void;
  disableRemove?: boolean;
}

function createOption(seed?: Partial<QuestionOption>): QuestionOption {
  const id =
    seed?.id ??
    (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `option-${Math.random().toString(36).slice(2, 10)}`);
  return {
    id,
    label: seed?.label ?? '',
    contentMarkdown: seed?.contentMarkdown ?? '',
    isCorrect: seed?.isCorrect ?? false,
  };
}

function OptionEditor({ option, index, onChange, onRemove, disableRemove }: OptionEditorProps) {
  const handleLabelChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(index, 'label', event.target.value);
    },
    [index, onChange]
  );

  const handleContentChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(index, 'contentMarkdown', event.target.value);
    },
    [index, onChange]
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <Stack gap={3}>
        <FormField>
          <FormLabel htmlFor={`option-label-${option.id}`}>Label</FormLabel>
          <Input
            id={`option-label-${option.id}`}
            name={`optionLabel-${index}`}
            value={option.label}
            onChange={handleLabelChange}
            placeholder="Choice label"
            required
          />
        </FormField>

        <FormField>
          <FormLabel htmlFor={`option-content-${option.id}`}>Content</FormLabel>
          <Textarea
            id={`option-content-${option.id}`}
            name={`optionContent-${index}`}
            value={option.contentMarkdown}
            onChange={handleContentChange}
            placeholder="Add the option text or explanation"
            rows={3}
            required
          />
        </FormField>

        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={option.isCorrect}
              onChange={(event) => onChange(index, 'isCorrect', event.target.checked)}
            />
            Correct answer
          </label>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            disabled={disableRemove}
          >
            <Icon name="Trash2" className="h-4 w-4" aria-hidden />
            Remove
          </Button>
        </div>
      </Stack>
    </div>
  );
}

function useExamOptions(initialOptions: ReadonlyArray<SearchableSelectOption>) {
  const [options, setOptions] = useState(initialOptions);
  const [isFetching, setIsFetching] = useState(false);

  const loadOptions = useCallback(async (subjectSlug: string | undefined) => {
    if (!subjectSlug) {
      setOptions([]);
      return;
    }

    setIsFetching(true);
    try {
      const response = await fetch(`/api/taxonomy/exams?subject=${encodeURIComponent(subjectSlug)}`);
      if (!response.ok) {
        throw new Error(`Failed to load exams for subject ${subjectSlug}`);
      }
      const data = (await response.json()) as { options: Array<{ value: string; label: string; description?: string; badge?: string }> };
      const mapped: SearchableSelectOption[] = data.options.map((option) => ({
        value: option.value,
        label: option.label,
        description: option.description,
        badge: option.badge,
      }));
      setOptions(mapped);
    } catch (error) {
      console.error('[QuestionForm] unable to fetch exams', error);
      setOptions([]);
    } finally {
      setIsFetching(false);
    }
  }, []);

  return { options, loadOptions, isFetching };
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

export function QuestionForm({
  action,
  subjects,
  initialExamOptions = [],
  defaultValues,
  submitLabel = 'Save question',
  headline = 'Question details',
  description = 'Manage content, metadata, and answer options for this question.',
  formId,
  onSuccess,
  submissionMode = 'page',
}: QuestionFormProps) {
  const hydratedDefaults: QuestionFormValues = useMemo(() => {
    return {
      text: defaultValues?.text ?? '',
      explanation: defaultValues?.explanation ?? '',
      allowMultiple: defaultValues?.allowMultiple ?? false,
      difficulty: defaultValues?.difficulty ?? 'MEDIUM',
      subjectSlug: defaultValues?.subjectSlug ?? '',
      examSlug: defaultValues?.examSlug ?? undefined,
      domain: defaultValues?.domain ?? '',
      source: defaultValues?.source ?? '',
      year: defaultValues?.year,
      status: defaultValues?.status ?? 'draft',
      id: defaultValues?.id,
      options:
        defaultValues?.options?.map((option) => createOption(option)) ??
        [createOption(), createOption(), createOption(), createOption()],
    } satisfies QuestionFormValues;
  }, [defaultValues]);

  const [formState, formAction] = useFormState(action, questionFormInitialState);
  const [values, setValues] = useState<QuestionFormValues>(hydratedDefaults);
  const [options, setOptions] = useState<QuestionOption[]>(hydratedDefaults.options);
  const [isPending, startTransition] = useTransition();
  const lastStatusRef = useRef(formState.status);

  const { options: examOptions, loadOptions: loadExamOptions, isFetching: isFetchingExams } = useExamOptions(initialExamOptions);

  useEffect(() => {
    setValues(hydratedDefaults);
    setOptions(hydratedDefaults.options);
  }, [hydratedDefaults]);

  useEffect(() => {
    if (formState.status === 'success' && lastStatusRef.current !== 'success') {
      onSuccess?.(formState);
    }
    lastStatusRef.current = formState.status;
  }, [formState, onSuccess]);

  useEffect(() => {
    if (values.subjectSlug) {
      startTransition(() => {
        void loadExamOptions(values.subjectSlug);
      });
    } else {
      setValues((previous) => ({ ...previous, examSlug: undefined }));
    }
  }, [values.subjectSlug, loadExamOptions]);

  const handleFieldChange = useCallback(
    (field: keyof QuestionFormValues, value: string | boolean | number | undefined) => {
      setValues((previous) => {
        const next: QuestionFormValues = {
          ...previous,
          [field]: value,
        };
        if (field === 'subjectSlug') {
          next.examSlug = undefined;
        }
        return next;
      });
    },
    []
  );

  const handleOptionChange = useCallback(
    (index: number, field: keyof QuestionOption, value: string | boolean) => {
      setOptions((previous) => {
        const next = [...previous];
        const target = { ...next[index] };
        if (field === 'isCorrect' && !values.allowMultiple && value === true) {
          next.forEach((item, itemIndex) => {
            if (itemIndex !== index) {
              next[itemIndex] = { ...item, isCorrect: false };
            }
          });
        }
        next[index] = {
          ...target,
          [field]: value,
        } as QuestionOption;
        return next;
      });
    },
    [values.allowMultiple]
  );

  const handleRemoveOption = useCallback((index: number) => {
    setOptions((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const handleAddOption = useCallback(() => {
    setOptions((previous) => [...previous, createOption()]);
  }, []);

  const optionsJson = useMemo(() => JSON.stringify(options), [options]);

  const fieldErrors = formState.fieldErrors ?? {};

  return (
    <EntityForm
      title={headline}
      description={description}
      headerActions={
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {values.status === 'published' ? 'Published' : 'Draft'}
        </span>
      }
      footer={<FormSubmitActions submitLabel={submitLabel} />}
      action={formAction}
      id={formId}
    >
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <input type="hidden" name="submissionMode" value={submissionMode} />
      <input type="hidden" name="allowMultiple" value={values.allowMultiple ? 'true' : 'false'} />
      <input type="hidden" name="options" value={optionsJson} />
      <input type="hidden" name="subjectSlug" value={values.subjectSlug} />
      <input type="hidden" name="examSlug" value={values.examSlug ?? ''} />
      <input type="hidden" name="difficulty" value={values.difficulty} />
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

      <FormSection title="Metadata" description="Categorise the question and control its visibility.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField error={fieldErrors.subjectSlug}>
            <FormLabel>Subject</FormLabel>
            <SearchableSelect
              options={subjects}
              placeholder="Select subject"
              value={values.subjectSlug}
              onChange={(value) => handleFieldChange('subjectSlug', value)}
              emptyState="No subjects found"
            />
          </FormField>

          <FormField error={fieldErrors.examSlug}>
            <FormLabel>Exam (optional)</FormLabel>
            <SearchableSelect
              options={examOptions}
              placeholder={isFetchingExams || isPending ? 'Loading exams…' : 'Select exam'}
              value={values.examSlug ?? ''}
              onChange={(value) => handleFieldChange('examSlug', value)}
              disabled={!values.subjectSlug || isFetchingExams || isPending}
              emptyState={values.subjectSlug ? 'No exams found for subject' : 'Select a subject first'}
            />
          </FormField>

          <FormField error={fieldErrors.difficulty}>
            <FormLabel>Difficulty</FormLabel>
            <SearchableSelect
              options={[
                { value: 'EASY', label: 'Easy' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HARD', label: 'Hard' },
                { value: 'EXPERT', label: 'Expert' },
              ]}
              value={values.difficulty}
              onChange={(value) => handleFieldChange('difficulty', value)}
              placeholder="Select difficulty"
            />
          </FormField>

          <FormField error={fieldErrors.status}>
            <FormLabel>Status</FormLabel>
            <SearchableSelect
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
              ]}
              value={values.status}
              onChange={(value) => handleFieldChange('status', value)}
              placeholder="Select status"
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField error={fieldErrors.domain}>
            <FormLabel>Domain (optional)</FormLabel>
            <Input
              name="domain"
              value={values.domain ?? ''}
              onChange={(event) => handleFieldChange('domain', event.target.value)}
              placeholder="e.g. Algebra"
            />
          </FormField>

          <FormField error={fieldErrors.source}>
            <FormLabel>Source (optional)</FormLabel>
            <Input
              name="source"
              value={values.source ?? ''}
              onChange={(event) => handleFieldChange('source', event.target.value)}
              placeholder="Publisher or reference"
            />
          </FormField>

          <FormField error={fieldErrors.year}>
            <FormLabel>Year (optional)</FormLabel>
            <Input
              name="year"
              inputMode="numeric"
              value={values.year ? String(values.year) : ''}
              onChange={(event) => handleFieldChange('year', event.target.value)}
              placeholder="2024"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Question content" description="Write the stem and optional explanation shown after submission.">
        <FormField error={fieldErrors.text}>
          <FormLabel>Question stem</FormLabel>
          <Textarea
            name="text"
            value={values.text}
            onChange={(event) => handleFieldChange('text', event.target.value)}
            rows={6}
            placeholder="Enter the full question prompt"
            required
          />
        </FormField>

        <FormField error={fieldErrors.explanation}>
          <FormLabel>Explanation (optional)</FormLabel>
          <Textarea
            name="explanation"
            value={values.explanation ?? ''}
            onChange={(event) => handleFieldChange('explanation', event.target.value)}
            rows={4}
            placeholder="Provide additional context or worked solution"
          />
        </FormField>

        <div className="rounded-lg bg-gray-50 px-4 py-3">
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <Checkbox
              checked={values.allowMultiple}
              onChange={(event) => handleFieldChange('allowMultiple', event.target.checked)}
            />
            Allow multiple correct answers
          </label>
        </div>
      </FormSection>

      <FormSection title="Answer options" description="Mark the correct answer(s) and keep labels clear.">
        <Stack gap={4}>
          {options.map((option, index) => (
            <OptionEditor
              key={option.id}
              option={option}
              index={index}
              onChange={handleOptionChange}
              onRemove={handleRemoveOption}
              disableRemove={options.length <= 2}
            />
          ))}

          {fieldErrors.options ? <FormError>{fieldErrors.options}</FormError> : null}

          <div>
            <Button type="button" variant="secondary" onClick={handleAddOption}>
              <Icon name="Plus" className="h-4 w-4" aria-hidden />
              Add option
            </Button>
          </div>
        </Stack>
      </FormSection>
    </EntityForm>
  );
}
