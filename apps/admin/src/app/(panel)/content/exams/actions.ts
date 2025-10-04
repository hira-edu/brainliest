'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createExamSchema,
  updateExamSchema,
  type CreateExamPayload,
  type UpdateExamPayload,
} from '@/lib/shared-schemas';
import { isZodErrorLike, mapZodErrorIssues } from '@/lib/zod-helpers';
import type { CreateExamInput, UpdateExamInput } from '@brainliest/db';
import { repositories } from '@/lib/repositories';
import { getAdminActor } from '@/lib/auth';

export interface ExamFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const examFormInitialState: ExamFormState = { status: 'idle' };

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

function normaliseCreatePayload(formData: FormData): CreateExamPayload {
  return createExamSchema.parse({
    slug: getString(formData, 'slug'),
    subjectSlug: getString(formData, 'subjectSlug'),
    title: getString(formData, 'title'),
    description: getOptionalString(formData, 'description'),
    difficulty: getOptionalString(formData, 'difficulty'),
    durationMinutes: getOptionalString(formData, 'durationMinutes'),
    questionTarget: getOptionalString(formData, 'questionTarget'),
    status: getString(formData, 'status', 'draft'),
  });
}

function normaliseUpdatePayload(formData: FormData): UpdateExamPayload {
  return updateExamSchema.parse({
    ...normaliseCreatePayload(formData),
    slug: getString(formData, 'slug'),
  });
}

function toCreateInput(payload: CreateExamPayload): CreateExamInput {
  return {
    slug: payload.slug,
    subjectSlug: payload.subjectSlug,
    title: payload.title,
    description: payload.description,
    difficulty: payload.difficulty,
    durationMinutes: payload.durationMinutes,
    questionTarget: payload.questionTarget,
    status: payload.status,
  } satisfies CreateExamInput;
}

function toUpdateInput(payload: UpdateExamPayload): UpdateExamInput {
  return {
    slug: payload.slug,
    subjectSlug: payload.subjectSlug,
    title: payload.title,
    description: payload.description,
    difficulty: payload.difficulty,
    durationMinutes: payload.durationMinutes,
    questionTarget: payload.questionTarget,
    status: payload.status,
  } satisfies UpdateExamInput;
}

export async function createExamAction(_: ExamFormState, formData: FormData): Promise<ExamFormState> {
  const actor = await getAdminActor();
  if (!actor) {
    return {
      status: 'error',
      message: 'Admin authentication is required to create exams.',
    } satisfies ExamFormState;
  }

  try {
    const payload = normaliseCreatePayload(formData);
    const input = toCreateInput(payload);
    await repositories.exams.create(input, actor.id);
    const submissionMode = formData.get('submissionMode');
    const stayOnPage = typeof submissionMode === 'string' && submissionMode === 'modal';

    revalidatePath('/content/exams');
    if (stayOnPage) {
      return {
        status: 'success',
        message: 'Exam created successfully.',
      } satisfies ExamFormState;
    }

    redirect(`/content/exams/${payload.slug}/edit?created=1`);
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapZodErrorIssues(error),
      } satisfies ExamFormState;
    }

    console.error('[exams/actions] create failed', error);
    return {
      status: 'error',
      message: 'Unable to create exam. Please try again.',
    } satisfies ExamFormState;
  }

  return examFormInitialState;
}

export async function updateExamAction(_: ExamFormState, formData: FormData): Promise<ExamFormState> {
  const actor = await getAdminActor();
  if (!actor) {
    return {
      status: 'error',
      message: 'Admin authentication is required to update exams.',
    } satisfies ExamFormState;
  }

  try {
    const payload = normaliseUpdatePayload(formData);
    const input = toUpdateInput(payload);
    await repositories.exams.update(input, actor.id);

    revalidatePath('/content/exams');
    revalidatePath(`/content/exams/${payload.slug}/edit`);

    return {
      status: 'success',
      message: 'Exam updated successfully.',
    } satisfies ExamFormState;
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapZodErrorIssues(error),
      } satisfies ExamFormState;
    }

    console.error('[exams/actions] update failed', error);
    return {
      status: 'error',
      message: 'Unable to update exam. Please try again.',
    } satisfies ExamFormState;
  }
}

export async function deleteExamAction(slug: string): Promise<ExamFormState> {
  const actor = await getAdminActor();
  if (!actor) {
    return {
      status: 'error',
      message: 'Admin authentication is required to delete exams.',
    } satisfies ExamFormState;
  }

  try {
    await repositories.exams.delete(slug, actor.id);
    revalidatePath('/content/exams');
    return {
      status: 'success',
      message: 'Exam deleted.',
    } satisfies ExamFormState;
  } catch (error) {
    console.error('[exams/actions] delete failed', error);
    return {
      status: 'error',
      message: 'Unable to delete exam. Please try again.',
    } satisfies ExamFormState;
  }
}
