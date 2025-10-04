'use server';

import { revalidatePath } from 'next/cache';

import {
  assertAdminActor,
  confirmTotpEnrollment,
  disableTotp,
  regenerateAdminRecoveryCodes,
  revokeRememberDevice,
  revokeRememberDevices,
  startTotpEnrollment,
} from '@/lib/auth/totp-service';

export interface TotpEnrollmentFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  recoveryCodes?: string[];
}

export const totpEnrollmentInitialState: TotpEnrollmentFormState = { status: 'idle' };

export async function startTotpEnrollmentAction() {
  const { id, email } = await assertAdminActor();
  return startTotpEnrollment(id, email);
}

export async function confirmTotpEnrollmentAction(
  _state: TotpEnrollmentFormState,
  formData: FormData
): Promise<TotpEnrollmentFormState> {
  const setupToken = formData.get('setupToken');
  const code = formData.get('code');

  if (typeof setupToken !== 'string' || typeof code !== 'string' || code.trim().length === 0) {
    return {
      status: 'error',
      message: 'Enter the verification code from your authenticator app.',
    } satisfies TotpEnrollmentFormState;
  }

  const { id } = await assertAdminActor();

  try {
    const result = await confirmTotpEnrollment(id, setupToken, code.trim());
    revalidatePath('/settings/security');
    return { status: 'success', recoveryCodes: result.recoveryCodes } satisfies TotpEnrollmentFormState;
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to enable multi-factor authentication.',
    } satisfies TotpEnrollmentFormState;
  }
}

export async function disableTotpAction(): Promise<{ status: 'ok' | 'error'; message?: string }> {
  const { id } = await assertAdminActor();
  try {
    await disableTotp(id);
    revalidatePath('/settings/security');
    return { status: 'ok' };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to disable multi-factor authentication.',
    };
  }
}

export async function regenerateRecoveryCodesAction(): Promise<
  { status: 'ok'; recoveryCodes: string[] } | { status: 'error'; message: string }
> {
  const { id } = await assertAdminActor();
  try {
    const codes = await regenerateAdminRecoveryCodes(id);
    revalidatePath('/settings/security');
    return { status: 'ok', recoveryCodes: codes };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to regenerate recovery codes.',
    };
  }
}

export async function revokeRememberDeviceAction(deviceId: string): Promise<{ status: 'ok' | 'error'; message?: string }> {
  const { id } = await assertAdminActor();
  try {
    await revokeRememberDevice(id, deviceId);
    revalidatePath('/settings/security');
    return { status: 'ok' };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to revoke trusted device.',
    };
  }
}

export async function revokeAllRememberDevicesAction(): Promise<{ status: 'ok' | 'error'; message?: string }> {
  const { id } = await assertAdminActor();
  try {
    await revokeRememberDevices(id);
    revalidatePath('/settings/security');
    return { status: 'ok' };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to revoke devices.',
    };
  }
}
