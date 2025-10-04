'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createUserSchema, updateUserSchema, type CreateUserPayload, type UpdateUserPayload } from '@/lib/shared-schemas';
import { isZodErrorLike, mapZodErrorIssues } from '@/lib/zod-helpers';
import type { CreateUserInput, UpdateUserInput } from '@brainliest/db';
import { repositories } from '@/lib/repositories';
import { getAdminActor } from '@/lib/auth';
import { hashPassword } from '@brainliest/shared/crypto/password';

export interface UserFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const userFormInitialState: UserFormState = { status: 'idle' };

const mapFieldErrors = (error: unknown): Record<string, string> => mapZodErrorIssues(error);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isUserProfile = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCreateUserPayload = (value: unknown): value is CreateUserPayload => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.email === 'string' &&
    typeof value.role === 'string' &&
    typeof value.status === 'string' &&
    typeof value.password === 'string' &&
    isUserProfile(value.profile)
  );
};

const isUpdateUserPayload = (value: unknown): value is UpdateUserPayload => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.role === 'string' &&
    typeof value.status === 'string' &&
    (value.password === undefined || typeof value.password === 'string') &&
    isUserProfile(value.profile)
  );
};

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

function normaliseCreatePayload(formData: FormData): CreateUserPayload {
  const raw: Record<string, unknown> = {
    email: getString(formData, 'email'),
    role: getString(formData, 'role'),
    status: getString(formData, 'status', 'active'),
    password: getString(formData, 'password'),
    profile: getOptionalString(formData, 'profile'),
  };

  const parsed: unknown = createUserSchema.parse(raw);
  if (!isCreateUserPayload(parsed)) {
    throw new Error('User payload failed validation');
  }
  return parsed;
}

function normaliseUpdatePayload(formData: FormData): UpdateUserPayload {
  const raw: Record<string, unknown> = {
    id: getString(formData, 'id'),
    email: getString(formData, 'email'),
    role: getString(formData, 'role'),
    status: getString(formData, 'status', 'active'),
    password: getOptionalString(formData, 'password'),
    profile: getOptionalString(formData, 'profile'),
  };

  const parsed: unknown = updateUserSchema.parse(raw);
  if (!isUpdateUserPayload(parsed)) {
    throw new Error('User payload failed validation');
  }
  return parsed;
}

async function toCreateInput(payload: CreateUserPayload): Promise<CreateUserInput> {
  const hashedPassword = await hashPassword(payload.password);

  return {
    email: payload.email,
    role: payload.role,
    status: payload.status,
    hashedPassword,
    profile: payload.profile,
  } satisfies CreateUserInput;
}

async function toUpdateInput(payload: UpdateUserPayload): Promise<UpdateUserInput> {
  const hashedPassword = payload.password ? await hashPassword(payload.password) : undefined;

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    status: payload.status,
    hashedPassword,
    profile: payload.profile,
  } satisfies UpdateUserInput;
}

function roleSegment(role: string): 'students' | 'admins' {
  return role.toUpperCase() === 'STUDENT' ? 'students' : 'admins';
}

export async function createUserAction(_: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await getAdminActor();
  if (!actor) {
    return {
      status: 'error',
      message: 'Admin authentication is required to create users.',
    } satisfies UserFormState;
  }

  try {
    const payload = normaliseCreatePayload(formData);
    const input = await toCreateInput(payload);
    const userId = await repositories.users.create(input);
    const submissionMode = formData.get('submissionMode');
    const stayOnPage = typeof submissionMode === 'string' && submissionMode === 'modal';

    const segment = roleSegment(payload.role);
    revalidatePath(`/users/${segment}`);
    if (stayOnPage) {
      return {
        status: 'success',
        message: 'User created successfully.',
      } satisfies UserFormState;
    }

    redirect(`/users/${segment}/${userId}/edit?created=1`);
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapFieldErrors(error),
      } satisfies UserFormState;
    }

    console.error('[users/actions] create failed', error);
    return {
      status: 'error',
      message: 'Unable to create user. Please try again.',
    } satisfies UserFormState;
  }

  return userFormInitialState;
}

export async function updateUserAction(_: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await getAdminActor();
  if (!actor) {
    return {
      status: 'error',
      message: 'Admin authentication is required to update users.',
    } satisfies UserFormState;
  }

  try {
    const payload = normaliseUpdatePayload(formData);
    const input = await toUpdateInput(payload);
    await repositories.users.update(input);

    const segment = roleSegment(payload.role);
    revalidatePath(`/users/${segment}`);

    return {
      status: 'success',
      message: 'User updated successfully.',
    } satisfies UserFormState;
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapFieldErrors(error),
      } satisfies UserFormState;
    }

    console.error('[users/actions] update failed', error);
    return {
      status: 'error',
      message: 'Unable to update user. Please try again.',
    } satisfies UserFormState;
  }
}

export async function deleteUserAction(id: string, role: string): Promise<UserFormState> {
  const actor = await getAdminActor();
  if (!actor) {
    return {
      status: 'error',
      message: 'Admin authentication is required to delete users.',
    } satisfies UserFormState;
  }

  try {
    await repositories.users.delete(id);
    const segment = roleSegment(role);
    revalidatePath(`/users/${segment}`);
    return {
      status: 'success',
      message: 'User deleted.',
    } satisfies UserFormState;
  } catch (error) {
    console.error('[users/actions] delete failed', error);
    return {
      status: 'error',
      message: 'Unable to delete user. Please try again.',
    } satisfies UserFormState;
  }
}
