import { randomBytes, scryptSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password';

const LEGACY_SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
};

function createLegacyScryptHash(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64, LEGACY_SCRYPT_PARAMS);

  return [
    'scrypt',
    LEGACY_SCRYPT_PARAMS.N,
    LEGACY_SCRYPT_PARAMS.r,
    LEGACY_SCRYPT_PARAMS.p,
    salt.toString('hex'),
    derivedKey.toString('hex'),
  ].join('$');
}

describe('password hashing', () => {
  it('hashes and verifies the same password', async () => {
    const password = 'CorrectHorseBatteryStaple!23';

    const hash = await hashPassword(password);
    expect(hash.startsWith('$2')).toBe(true);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('does not verify incorrect passwords', async () => {
    const password = 'OriginalPassword!';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword('WrongPassword!', hash);
    expect(isValid).toBe(false);
  });

  it('verifies legacy scrypt hashes', async () => {
    const password = 'LegacyPassword!42';
    const legacyHash = createLegacyScryptHash(password);

    const isValid = await verifyPassword(password, legacyHash);
    expect(isValid).toBe(true);

    const invalidAttempt = await verifyPassword('incorrect', legacyHash);
    expect(invalidAttempt).toBe(false);
  });
});
