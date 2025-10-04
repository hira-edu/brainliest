'use server';

import { redirect } from 'next/navigation';

import { verifyPassword } from '@brainliest/shared/crypto/password';

import { repositories } from '../repositories';
import { createSessionCookie, deleteSessionCookie } from './session';
import type { SignInFormState } from './sign-in-state';

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function signInAction(
  _state: SignInFormState,
  formData: FormData
): Promise<SignInFormState> {
  const email = getString(formData, 'email');
  const password = getString(formData, 'password');
  const remember = formData.get('remember') === 'on';

  if (email.length === 0 || password.length === 0) {
    return {
      status: 'error',
      message: 'Please provide both email and password.',
      fieldErrors: {
        ...(email.length === 0 ? { email: 'Email is required.' } : {}),
        ...(password.length === 0 ? { password: 'Password is required.' } : {}),
      },
    } satisfies SignInFormState;
  }

  const admin = await repositories.adminUsers.findByEmail(email.toLowerCase());
  if (!admin || admin.status !== 'active') {
    return {
      status: 'error',
      message: 'Invalid email or password.',
    } satisfies SignInFormState;
  }

  const validPassword = await verifyPassword(password, admin.passwordHash);
  if (!validPassword) {
    return {
      status: 'error',
      message: 'Invalid email or password.',
    } satisfies SignInFormState;
  }

  await repositories.adminUsers.updateLastLogin(admin.id, new Date());
  await createSessionCookie(
    { id: admin.id, email: admin.email, role: admin.role },
    { remember }
  );

  redirect('/dashboard');
}

export async function signOutAction(): Promise<void> {
  await deleteSessionCookie();
  redirect('/sign-in');
}
