import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = process.env;

const REQUIRED_ENV = {
  DATABASE_URL: 'https://postgres.example.com/db',
  REDIS_URL: 'https://redis.example.com',
  NEXTAUTH_SECRET: '0123456789abcdef0123456789abcdef',
  NEXTAUTH_URL: 'https://brainliest.test',
  OPENAI_API_KEY: 'sk-test-key',
  SITE_PRIMARY_DOMAIN: 'brainliest.test',
  SITE_ADMIN_DOMAIN: 'admin.brainliest.test',
  SITE_KMS_MASTER_KEY: 'a'.repeat(64),
  ADMIN_SESSION_HMAC_SECRET: 'b'.repeat(64),
  ADMIN_REMEMBER_DEVICE_HMAC_SECRET: 'c'.repeat(64),
};

describe('env.server', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, ...REQUIRED_ENV } as NodeJS.ProcessEnv;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.resetModules();
  });

  it('parses server environment variables', async () => {
    const { env } = await import('./env.server');
    expect(env.DATABASE_URL).toBe(REQUIRED_ENV.DATABASE_URL);
    expect(env.SITE_PRIMARY_DOMAIN).toBe(REQUIRED_ENV.SITE_PRIMARY_DOMAIN);
  });

  it('throws when required env vars are missing', async () => {
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
    vi.resetModules();
    await expect(import('./env.server')).rejects.toThrowError();
  });
});
