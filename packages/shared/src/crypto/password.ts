import { randomBytes, timingSafeEqual, scrypt as scryptCallback } from 'node:crypto';
import type { ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;

const scryptAsync = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: ScryptOptions
) => Promise<Buffer>;

interface ParsedHash {
  readonly salt: Buffer;
  readonly derivedKey: Buffer;
  readonly params: {
    N: number;
    r: number;
    p: number;
  };
}

function serializeHash(params: ParsedHash): string {
  return [
    'scrypt',
    params.params.N,
    params.params.r,
    params.params.p,
    params.salt.toString('hex'),
    params.derivedKey.toString('hex'),
  ].join('$');
}

function parseHash(hash: string): ParsedHash {
  const parts = hash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    throw new Error('Invalid password hash format');
  }

  const [_, nStr, rStr, pStr, saltHex, keyHex] = parts;
  const N = Number.parseInt(nStr, 10);
  const r = Number.parseInt(rStr, 10);
  const p = Number.parseInt(pStr, 10);

  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    throw new Error('Invalid scrypt parameters in hash');
  }

  return {
    salt: Buffer.from(saltHex, 'hex'),
    derivedKey: Buffer.from(keyHex, 'hex'),
    params: { N, r, p },
  };
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(plainText, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_r,
    p: SCRYPT_p,
  });

  return serializeHash({ salt, derivedKey, params: { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p } });
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  const parsed = parseHash(hash);
  const derivedKey = await scryptAsync(plainText, parsed.salt, parsed.derivedKey.length, parsed.params);

  return timingSafeEqual(derivedKey, parsed.derivedKey);
}
