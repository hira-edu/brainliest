'use server';

import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createUserSchema, updateUserSchema, type CreateUserPayload, type UpdateUserPayload } from '@/lib/shared-schemas';
import { isZodErrorLike, mapZodErrorIssues } from '@/lib/zod-helpers';
import type { CreateUserInput, UpdateUserInput } from '@brainliest/db';
import { repositories } from '@/lib/repositories';

export interface UserFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const userFormInitialState: UserFormState = { status: 'idle' };

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

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

function toCreateInput(payload: CreateUserPayload): CreateUserInput {
  return {
    email: payload.email,
    role: payload.role,
    status: payload.status,
    hashedPassword: hashPassword(payload.password),
    profile: payload.profile,
  } satisfies CreateUserInput;
}

function toUpdateInput(payload: UpdateUserPayload): UpdateUserInput {
  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    status: payload.status,
    hashedPassword: payload.password ? hashPassword(payload.password) : undefined,
    profile: payload.profile,
  } satisfies UpdateUserInput;
}

function roleSegment(role: string): 'students' | 'admins' {
  return role.toUpperCase() === 'STUDENT' ? 'students' : 'admins';
}

export async function createUserAction(_: UserFormState, formData: FormData): Promise<UserFormState> {
  try {
    const payload = normaliseCreatePayload(formData);
    const input = toCreateInput(payload);
    const userId = await repositories.users.create(input);

    const segment = roleSegment(payload.role);
    revalidatePath(`/users/${segment}`);
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
  try {
    const payload = normaliseUpdatePayload(formData);
    const input = toUpdateInput(payload);
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
