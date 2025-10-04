'use server';

import { revalidatePath } from 'next/cache';
import { createIntegrationKey, rotateIntegrationKey } from '@/lib/integrations';
import {
  createIntegrationKeySchema,
  rotateIntegrationKeySchema,
  type CreateIntegrationKeyPayload,
  type RotateIntegrationKeyPayload,
} from '@/lib/shared-schemas';
import { isZodErrorLike, mapZodErrorIssues } from '@/lib/zod-helpers';

export interface IntegrationKeyFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
  secret?: string;
}

export const integrationKeyInitialState: IntegrationKeyFormState = { status: 'idle' };

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

function normalizeCreatePayload(formData: FormData): CreateIntegrationKeyPayload {
  const raw = {
    name: getString(formData, 'name'),
    type: getString(formData, 'type'),
    environment: getString(formData, 'environment'),
    description: getOptionalString(formData, 'description'),
    value: getString(formData, 'value'),
  } satisfies Record<string, unknown>;

  const parsed: unknown = createIntegrationKeySchema.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Integration key payload failed validation');
  }

  return parsed as CreateIntegrationKeyPayload;
}

function normalizeRotatePayload(formData: FormData): RotateIntegrationKeyPayload {
  const raw = {
    id: getString(formData, 'id'),
    value: getString(formData, 'value'),
  } satisfies Record<string, unknown>;

  const parsed: unknown = rotateIntegrationKeySchema.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Rotate integration key payload failed validation');
  }

  return parsed as RotateIntegrationKeyPayload;
}

export async function createIntegrationKeyAction(
  _state: IntegrationKeyFormState,
  formData: FormData
): Promise<IntegrationKeyFormState> {
  try {
    const payload = normalizeCreatePayload(formData);
    await createIntegrationKey(payload);

    revalidatePath('/integrations/keys');

    return {
      status: 'success',
      message: 'Integration key created successfully. Copy the value below; it will not be shown again.',
      secret: payload.value,
    } satisfies IntegrationKeyFormState;
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapZodErrorIssues(error),
      } satisfies IntegrationKeyFormState;
    }

    console.error('[integrations/actions] create key failed', error);
    return {
      status: 'error',
      message: 'Unable to create integration key. Please try again.',
    } satisfies IntegrationKeyFormState;
  }
}

export async function rotateIntegrationKeyAction(
  _state: IntegrationKeyFormState,
  formData: FormData
): Promise<IntegrationKeyFormState> {
  try {
    const payload = normalizeRotatePayload(formData);
    await rotateIntegrationKey(payload);

    revalidatePath('/integrations/keys');

    return {
      status: 'success',
      message: 'Integration key rotated successfully. Copy the new value below.',
      secret: payload.value,
    } satisfies IntegrationKeyFormState;
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapZodErrorIssues(error),
      } satisfies IntegrationKeyFormState;
    }

    console.error('[integrations/actions] rotate key failed', error);
    return {
      status: 'error',
      message: 'Unable to rotate integration key. Please try again.',
    } satisfies IntegrationKeyFormState;
  }
}
