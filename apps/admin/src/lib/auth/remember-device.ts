import 'server-only';

import { randomBytes, createHmac } from 'node:crypto';

import { cookies } from 'next/headers';

import { env } from '@brainliest/config';
import { hashRememberDeviceToken } from '@brainliest/shared/crypto/totp';

export const REMEMBER_DEVICE_COOKIE = 'admin_device';
const DEVICE_TTL_DAYS = 30;
const DEVICE_COOKIE_MAX_AGE = DEVICE_TTL_DAYS * 24 * 60 * 60; // seconds

function signDeviceToken(deviceId: string, token: string): string {
  const data = `${deviceId}.${token}`;
  return createHmac('sha256', Buffer.from(env.ADMIN_REMEMBER_DEVICE_HMAC_SECRET, 'hex'))
    .update(data)
    .digest('hex');
}

export function createRememberDeviceValue(deviceId: string, token: string): string {
  const signature = signDeviceToken(deviceId, token);
  return `${deviceId}.${token}.${signature}`;
}

export function parseRememberDeviceValue(value: string | undefined): { deviceId: string; token: string } | null {
  if (!value) {
    return null;
  }

  const segments = value.split('.');
  if (segments.length !== 3) {
    return null;
  }

  const [deviceId, token, signature] = segments;
  const expectedSignature = signDeviceToken(deviceId, token);
  if (signature !== expectedSignature) {
    return null;
  }

  return { deviceId, token };
}

export function generateRememberDeviceToken(): { deviceId: string; token: string; tokenHash: string; expiresAt: Date } {
  const deviceId = randomBytes(16).toString('hex');
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashRememberDeviceToken(token);
  const expiresAt = new Date(Date.now() + DEVICE_COOKIE_MAX_AGE * 1000);
  return { deviceId, token, tokenHash, expiresAt };
}

export async function setRememberDeviceCookie(value: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: REMEMBER_DEVICE_COOKIE,
    value,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
  });
}

export async function clearRememberDeviceCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(REMEMBER_DEVICE_COOKIE);
}

export function isRememberDeviceExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}

export function rememberDeviceCookieMaxAgeSeconds(): number {
  return DEVICE_COOKIE_MAX_AGE;
}
