import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('hashes and verifies the same password', async () => {
    const password = 'CorrectHorseBatteryStaple!23';

    const hash = await hashPassword(password);
    expect(hash.startsWith('scrypt$')).toBe(true);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('does not verify incorrect passwords', async () => {
    const password = 'OriginalPassword!';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword('WrongPassword!', hash);
    expect(isValid).toBe(false);
  });
});
