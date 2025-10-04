import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { encrypt, decrypt } from '@brainliest/shared/crypto/encryption';

export const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours
const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

type SessionPayload = {
  id: string;
  email: string;
  role: string | null;
  exp: number;
};

function serializePayload(payload: SessionPayload): Promise<string> {
  return encrypt(JSON.stringify(payload));
}

async function deserializePayload(token: string): Promise<SessionPayload | null> {
  try {
    const raw = await decrypt(token);
    const parsed = JSON.parse(raw) as Partial<SessionPayload>;

    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      role: typeof parsed.role === 'string' ? parsed.role : null,
      exp: parsed.exp,
    } satisfies SessionPayload;
  } catch (error) {
    console.error('[auth] failed to parse admin session token', error);
    return null;
  }
}

export async function createSessionCookie(
  admin: { id: string; email: string; role: string | null },
  options: { remember?: boolean } = {}
): Promise<void> {
  const cookieStore = await cookies();
  const now = Date.now();
  const maxAge = options.remember ? REMEMBER_ME_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS;
  const exp = now + maxAge * 1000;

  const token = await serializePayload({
    id: admin.id,
    email: admin.email,
    role: admin.role,
    exp,
  });

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAdminSession(): Promise<SessionPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    redirect('/sign-in');
  }

  const payload = await deserializePayload(token);
  if (!payload || payload.exp < Date.now()) {
    await deleteSessionCookie();
    redirect('/sign-in');
  }

  return payload;
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const payload = await deserializePayload(token);
  if (!payload || payload.exp < Date.now()) {
    await deleteSessionCookie();
    return null;
  }

  return payload;
}
