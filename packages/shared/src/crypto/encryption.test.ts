import { beforeAll, describe, expect, it } from 'vitest';

process.env.DATABASE_URL ??= 'postgres://test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.NEXTAUTH_SECRET ??= 's'.repeat(32);
process.env.NEXTAUTH_URL ??= 'http://localhost:3000';
process.env.OPENAI_API_KEY ??= 'sk-test-abcdefghijklmnopqrstuvwxyz012345';
process.env.SITE_PRIMARY_DOMAIN ??= 'localhost';
process.env.SITE_ADMIN_DOMAIN ??= 'localhost';
process.env.SITE_KMS_MASTER_KEY ??= 'a'.repeat(64);
process.env.ADMIN_SESSION_HMAC_SECRET ??= 'b'.repeat(64);
process.env.ADMIN_REMEMBER_DEVICE_HMAC_SECRET ??= 'c'.repeat(64);

let encryptFn: (plaintext: string) => Promise<string>;
let decryptFn: (ciphertext: string) => Promise<string>;

beforeAll(async () => {
  const module = await import('./encryption');
  encryptFn = module.encrypt;
  decryptFn = module.decrypt;
});

describe('encryption helpers', () => {
  it('round-trips plaintext through encrypt/decrypt', async () => {
    const plaintext = 'super-secret-value';

    const encrypted = await encryptFn(plaintext);
    expect(encrypted).toBeTypeOf('string');

    const decrypted = await decryptFn(encrypted);
    expect(decrypted).toEqual(plaintext);
  });

  it('produces different ciphertexts for the same plaintext', async () => {
    const plaintext = 'deterministic-iv-check';

    const first = await encryptFn(plaintext);
    const second = await encryptFn(plaintext);

    expect(first).not.toEqual(second);
  });
});
