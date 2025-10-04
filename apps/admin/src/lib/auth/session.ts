import 'server-only';

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { env, redisKeys } from '@brainliest/config';
import { redis } from '@brainliest/shared/adapters';
import { decrypt, encrypt } from '@brainliest/shared/crypto/encryption';

export const SESSION_COOKIE_NAME = 'admin_session';

const SESSION_VERSION = 1;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours
const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const REFRESH_THRESHOLD_SECONDS = 60 * 30; // 30 minutes

interface SessionCookiePayload {
  sid: string;
  exp: number;
  ver: number;
}

interface StoredSessionRecord {
  sessionId: string;
  adminId: string;
  email: string;
  role: string | null;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  maxAgeSeconds: number;
  remember: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  mfaCompletedAt: number | null;
}

export interface AdminSession {
  sessionId: string;
  adminId: string;
  email: string;
  role: string | null;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  remember: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  mfaCompletedAt: Date | null;
}

export interface CreateSessionOptions {
  remember?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  mfaCompletedAt?: Date | null;
}

const SESSION_HMAC_SECRET = Buffer.from(env.ADMIN_SESSION_HMAC_SECRET, 'hex');

function signToken(payload: string): string {
  return createHmac('sha256', SESSION_HMAC_SECRET).update(payload).digest('hex');
}

function verifySignature(payload: string, signature: string): boolean {
  const expected = signToken(payload);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const candidateBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  try {
    return timingSafeEqual(expectedBuffer, candidateBuffer);
  } catch {
    return false;
  }
}

async function encodeCookieValue(payload: SessionCookiePayload): Promise<string> {
  const encrypted = await encrypt(JSON.stringify(payload));
  const signature = signToken(encrypted);
  return `${encrypted}.${signature}`;
}

async function decodeCookieValue(raw: string): Promise<SessionCookiePayload | null> {
  const [encrypted, signature] = raw.split('.');

  if (!encrypted || !signature) {
    return null;
  }

  if (!verifySignature(encrypted, signature)) {
    return null;
  }

  try {
    const json = await decrypt(encrypted);
    const parsed = JSON.parse(json) as Partial<SessionCookiePayload>;

    if (
      !parsed ||
      typeof parsed.sid !== 'string' ||
      typeof parsed.exp !== 'number' ||
      typeof parsed.ver !== 'number'
    ) {
      return null;
    }

    return {
      sid: parsed.sid,
      exp: parsed.exp,
      ver: parsed.ver,
    } satisfies SessionCookiePayload;
  } catch (error) {
    console.error('[auth] failed to parse admin session cookie', error);
    return null;
  }
}

function sessionKey(sessionId: string): string {
  return redisKeys.adminSession(sessionId);
}

function toAdminSession(record: StoredSessionRecord): AdminSession {
  const session: AdminSession = {
    sessionId: record.sessionId,
    adminId: record.adminId,
    email: record.email,
    role: record.role,
    createdAt: new Date(record.createdAt),
    lastSeenAt: new Date(record.lastSeenAt),
    expiresAt: new Date(record.expiresAt),
    remember: record.remember,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    mfaCompletedAt: record.mfaCompletedAt ? new Date(record.mfaCompletedAt) : null,
  };

  return session;
}

function normaliseRecord(raw: unknown): StoredSessionRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const payload = raw as Record<string, unknown>;

  const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId : null;
  const adminId = typeof payload.adminId === 'string' ? payload.adminId : null;
  const email = typeof payload.email === 'string' ? payload.email : null;
  const role = typeof payload.role === 'string' ? payload.role : null;
  const createdAt = typeof payload.createdAt === 'number' ? payload.createdAt : null;
  const lastSeenAt = typeof payload.lastSeenAt === 'number' ? payload.lastSeenAt : null;
  const expiresAt = typeof payload.expiresAt === 'number' ? payload.expiresAt : null;
  const maxAgeSeconds = typeof payload.maxAgeSeconds === 'number' ? payload.maxAgeSeconds : null;
  const remember = typeof payload.remember === 'boolean' ? payload.remember : null;

  if (
    !sessionId ||
    !adminId ||
    !email ||
    createdAt === null ||
    lastSeenAt === null ||
    expiresAt === null ||
    maxAgeSeconds === null ||
    remember === null
  ) {
    return null;
  }

  let ipAddress: string | null = null;
  if (typeof payload.ipAddress === 'string') {
    ipAddress = payload.ipAddress;
  }

  let userAgent: string | null = null;
  if (typeof payload.userAgent === 'string') {
    userAgent = payload.userAgent;
  }

  let mfaCompletedAt: number | null = null;
  if (typeof payload.mfaCompletedAt === 'number') {
    mfaCompletedAt = payload.mfaCompletedAt;
  }

  const record: StoredSessionRecord = {
    sessionId,
    adminId,
    email,
    role,
    createdAt,
    lastSeenAt,
    expiresAt,
    maxAgeSeconds,
    remember,
    ipAddress,
    userAgent,
    mfaCompletedAt,
  };

  return record;
}

async function getSessionRecord(sessionId: string): Promise<StoredSessionRecord | null> {
  try {
    const raw = await redis.get(sessionKey(sessionId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    const record = normaliseRecord(parsed);

    if (!record) {
      await redis.del(sessionKey(sessionId));
    }

    return record;
  } catch (error) {
    console.error('[auth] failed to load admin session record', error);
    await redis.del(sessionKey(sessionId));
    return null;
  }
}

async function persistSessionRecord(record: StoredSessionRecord): Promise<void> {
  const ttlSeconds = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
  await redis.set(sessionKey(record.sessionId), JSON.stringify(record), 'EX', ttlSeconds);
}

async function removeSessionRecord(sessionId: string): Promise<void> {
  await redis.del(sessionKey(sessionId));
}

function computeMaxAgeSeconds(options?: CreateSessionOptions): number {
  return options?.remember ? REMEMBER_ME_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS;
}

export async function createSessionCookie(
  admin: { id: string; email: string; role: string | null },
  options: CreateSessionOptions = {}
): Promise<AdminSession> {
  const cookieStore = await cookies();

  const now = Date.now();
  const sessionId = randomUUID();
  const maxAgeSeconds = computeMaxAgeSeconds(options);
  const expiresAt = now + maxAgeSeconds * 1000;

  const record: StoredSessionRecord = {
    sessionId,
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    createdAt: now,
    lastSeenAt: now,
    expiresAt,
    maxAgeSeconds,
    remember: Boolean(options.remember),
    ipAddress: options.ipAddress ?? null,
    userAgent: options.userAgent ?? null,
    mfaCompletedAt: options.mfaCompletedAt ? options.mfaCompletedAt.getTime() : null,
  };

  await persistSessionRecord(record);

  const cookieValue = await encodeCookieValue({ sid: sessionId, exp: expiresAt, ver: SESSION_VERSION });

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  });

  return toAdminSession(record);
}

export async function deleteSessionCookie(sessionId?: string): Promise<void> {
  const cookieStore = await cookies();

  let targetSessionId = sessionId;

  if (!targetSessionId) {
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const payload = await decodeCookieValue(token);
      targetSessionId = payload?.sid;
    }
  }

  if (targetSessionId) {
    await removeSessionRecord(targetSessionId);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function readSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await decodeCookieValue(token);
  if (!payload) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  const record = await getSessionRecord(payload.sid);
  if (!record) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  const now = Date.now();
  if (record.expiresAt <= now) {
    await deleteSessionCookie(record.sessionId);
    return null;
  }

  const timeRemaining = record.expiresAt - now;
  const refreshThreshold = REFRESH_THRESHOLD_SECONDS * 1000;
  const shouldRefresh = timeRemaining <= refreshThreshold;

  record.lastSeenAt = now;

  if (shouldRefresh) {
    record.expiresAt = now + record.maxAgeSeconds * 1000;
  }

  await persistSessionRecord(record);

  if (shouldRefresh) {
    const refreshed = await encodeCookieValue({ sid: record.sessionId, exp: record.expiresAt, ver: SESSION_VERSION });
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: refreshed,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: record.maxAgeSeconds,
    });
  }

  return toAdminSession(record);
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await readSession();
  if (!session) {
    redirect('/sign-in');
  }
  return session;
}
