'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createQuestionSchema,
  questionOptionInputSchema,
  updateQuestionSchema,
  type CreateQuestionPayload,
} from '@/lib/shared-schemas';
import { isZodErrorLike, mapZodErrorIssues } from '@/lib/zod-helpers';
import type { CreateQuestionInput, QuestionOptionInput, UpdateQuestionInput } from '@brainliest/db';
import { repositories } from '@/lib/repositories';
import { getAdminActor } from '@/lib/auth';

export interface QuestionFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

const initialState: QuestionFormState = { status: 'idle' };

const getString = (formData: FormData, key: string, fallback = ''): string => {
  const value = formData.get(key);
  return typeof value === 'string' ? value : fallback;
};

const getOptionalString = (formData: FormData, key: string): string | undefined => {
  const value = formData.get(key);
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getBoolean = (formData: FormData, key: string): boolean => {
  const value = formData.get(key);
  return typeof value === 'string' ? value === 'true' : false;
};

function parseOptions(raw: string | undefined): CreateQuestionPayload['options'] {
  if (!raw || raw.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = questionOptionInputSchema.array().safeParse(parsed);
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('[questions/actions] Failed to parse options payload', error);
  }

  return [];
}

function deriveCorrectIndices(options: ReadonlyArray<QuestionOptionInput>): number[] {
  const indices: number[] = [];
  options.forEach((option, index) => {
    if (option.isCorrect) {
      indices.push(index);
    }
  });
  return indices;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
function buildCreateQuestionInput(formData: FormData): CreateQuestionInput {
  const payload = createQuestionSchema.parse({
    text: getString(formData, 'text'),
    explanation: getOptionalString(formData, 'explanation'),
    allowMultiple: getBoolean(formData, 'allowMultiple'),
    difficulty: getString(formData, 'difficulty'),
    subjectSlug: getString(formData, 'subjectSlug'),
    examSlug: getOptionalString(formData, 'examSlug'),
    domain: getOptionalString(formData, 'domain'),
    source: getOptionalString(formData, 'source'),
    year: getOptionalString(formData, 'year'),
    status: getString(formData, 'status', 'draft'),
    options: parseOptions(getOptionalString(formData, 'options')),
  });

  return buildCreateQuestionInputFromParsed(payload);
}

function buildUpdateQuestionInput(formData: FormData): UpdateQuestionInput {
  const payload = updateQuestionSchema.parse({
    text: getString(formData, 'text'),
    explanation: getOptionalString(formData, 'explanation'),
    allowMultiple: getBoolean(formData, 'allowMultiple'),
    difficulty: getString(formData, 'difficulty'),
    subjectSlug: getString(formData, 'subjectSlug'),
    examSlug: getOptionalString(formData, 'examSlug'),
    domain: getOptionalString(formData, 'domain'),
    source: getOptionalString(formData, 'source'),
    year: getOptionalString(formData, 'year'),
    status: getString(formData, 'status', 'draft'),
    options: parseOptions(getOptionalString(formData, 'options')),
    id: getString(formData, 'id'),
  });

  const { id, ...rest } = payload;
  const createPayload: CreateQuestionPayload = {
    text: rest.text,
    explanation: rest.explanation,
    allowMultiple: rest.allowMultiple,
    difficulty: rest.difficulty,
    subjectSlug: rest.subjectSlug,
    examSlug: rest.examSlug,
    domain: rest.domain,
    source: rest.source,
    year: rest.year,
    status: rest.status,
    options: rest.options,
  };

  const createInput = buildCreateQuestionInputFromParsed(createPayload);
  return {
    id,
    ...createInput,
  } satisfies UpdateQuestionInput;
}

function buildCreateQuestionInputFromParsed(data: CreateQuestionPayload): CreateQuestionInput {
  const options: QuestionOptionInput[] = data.options.map(
    (option: CreateQuestionPayload['options'][number]): QuestionOptionInput => ({
      id: option.id,
      label: option.label,
      contentMarkdown: option.contentMarkdown,
      isCorrect: option.isCorrect ?? false,
    })
  );

  const correctIndices = deriveCorrectIndices(options);
  const allowMultiple = data.allowMultiple || correctIndices.length > 1;

  return {
    text: data.text,
    explanation: data.explanation,
    allowMultiple,
    difficulty: data.difficulty,
    subjectSlug: data.subjectSlug,
    examSlug: data.examSlug,
    domain: data.domain,
    source: data.source,
    year: data.year,
    status: data.status,
    options,
    correctAnswer: !allowMultiple && correctIndices.length > 0 ? correctIndices[0] : undefined,
    correctAnswers: allowMultiple ? correctIndices : undefined,
  } satisfies CreateQuestionInput;
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

export async function createQuestionAction(_: QuestionFormState, formData: FormData): Promise<QuestionFormState> {
  const actor = await getAdminActor();
  if (!actor) {
    return {
      status: 'error',
      message: 'Admin authentication is required to create questions.',
    } satisfies QuestionFormState;
  }

  try {
    const input = buildCreateQuestionInput(formData);
    const questionId = await repositories.questions.create(input, actor.id);
    const submissionMode = formData.get('submissionMode');
    const stayOnPage = typeof submissionMode === 'string' && submissionMode === 'modal';

    revalidatePath('/content/questions');
    if (stayOnPage) {
      return {
        status: 'success',
        message: 'Question created successfully.',
      } satisfies QuestionFormState;
    }

    redirect(`/content/questions/${questionId}/edit?created=1`);
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapZodErrorIssues(error, { collapseOptionsPath: true }),
      } satisfies QuestionFormState;
    }

    console.error('[questions/actions] create failed', error);
    return {
      status: 'error',
      message: 'Unable to create question. Please try again.',
    } satisfies QuestionFormState;
  }

  return initialState;
}

export async function updateQuestionAction(_: QuestionFormState, formData: FormData): Promise<QuestionFormState> {
  const actor = await getAdminActor();
  if (!actor) {
    return {
      status: 'error',
      message: 'Admin authentication is required to update questions.',
    } satisfies QuestionFormState;
  }

  try {
    const input = buildUpdateQuestionInput(formData);
    const { id } = input;
    await repositories.questions.update(input, actor.id);

    revalidatePath('/content/questions');
    revalidatePath(`/content/questions/${id}/edit`);

    return {
      status: 'success',
      message: 'Question updated successfully.',
    } satisfies QuestionFormState;
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapZodErrorIssues(error, { collapseOptionsPath: true }),
      } satisfies QuestionFormState;
    }

    console.error('[questions/actions] update failed', error);
    return {
      status: 'error',
      message: 'Unable to update question. Please try again.',
    } satisfies QuestionFormState;
  }
}

export async function deleteQuestionAction(questionId: string): Promise<QuestionFormState> {
  const actor = await getAdminActor();
  if (!actor) {
    return {
      status: 'error',
      message: 'Admin authentication is required to delete questions.',
    } satisfies QuestionFormState;
  }

  try {
    await repositories.questions.delete(questionId, actor.id);
    revalidatePath('/content/questions');
    return {
      status: 'success',
      message: 'Question deleted.',
    } satisfies QuestionFormState;
  } catch (error) {
    console.error('[questions/actions] delete failed', error);
    return {
      status: 'error',
      message: 'Unable to delete question. Please try again.',
    } satisfies QuestionFormState;
  }
}

export { initialState as questionFormInitialState };
