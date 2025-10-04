import 'server-only';

import { randomUUID } from 'node:crypto';

import { redis } from '@brainliest/shared/adapters';
import { redisKeys } from '@brainliest/config';

const CHALLENGE_TTL_SECONDS = 60 * 10; // 10 minutes

export interface TotpChallengePayload {
  readonly challengeId: string;
  readonly adminId: string;
  readonly email: string;
  readonly rememberSession: boolean;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly createdAt: number;
}

export async function createTotpChallenge(payload: {
  adminId: string;
  email: string;
  rememberSession: boolean;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<TotpChallengePayload> {
  const challengeId = randomUUID();
  const record: TotpChallengePayload = {
    challengeId,
    adminId: payload.adminId,
    email: payload.email,
    rememberSession: payload.rememberSession,
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
    createdAt: Date.now(),
  };

  await redis.set(redisKeys.adminTotpChallenge(challengeId), JSON.stringify(record), 'EX', CHALLENGE_TTL_SECONDS);
  return record;
}

export async function readTotpChallenge(challengeId: string): Promise<TotpChallengePayload | null> {
  const raw = await redis.get(redisKeys.adminTotpChallenge(challengeId));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as TotpChallengePayload;
    return parsed;
  } catch (error) {
    console.error('[auth] failed to parse TOTP challenge payload', error);
    await redis.del(redisKeys.adminTotpChallenge(challengeId));
    return null;
  }
}

export async function deleteTotpChallenge(challengeId: string): Promise<void> {
  await redis.del(redisKeys.adminTotpChallenge(challengeId));
}
