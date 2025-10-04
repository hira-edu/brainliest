import bcrypt from 'bcrypt';
import { timingSafeEqual, scrypt as scryptCallback } from 'node:crypto';
import type { ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

const BCRYPT_SALT_ROUNDS = 12;

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

function isLegacyScryptHash(hash: string): boolean {
  return hash.startsWith('scrypt$');
}

async function verifyLegacyScryptHash(plainText: string, hash: string): Promise<boolean> {
  try {
    const parsed = parseHash(hash);
    const derivedKey = await scryptAsync(plainText, parsed.salt, parsed.derivedKey.length, parsed.params);

    return timingSafeEqual(derivedKey, parsed.derivedKey);
  } catch {
    return false;
  }
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  if (isLegacyScryptHash(hash)) {
    return verifyLegacyScryptHash(plainText, hash);
  }

  try {
    return await bcrypt.compare(plainText, hash);
  } catch {
    return false;
  }
}
