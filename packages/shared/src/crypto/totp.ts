import { randomBytes, createHmac, createHash } from 'node:crypto';

import { base32Decode, base32Encode } from './base32';

const DEFAULT_STEP_SECONDS = 30;
const DEFAULT_DIGITS = 6;
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_BLOCK_SIZE = 4;

export interface GenerateTotpSecretOptions {
  readonly size?: number;
}

export interface VerifyTotpOptions {
  readonly window?: number;
  readonly stepSeconds?: number;
  readonly digits?: number;
  readonly timestamp?: number;
}

function toBase32Secret(bytes: Uint8Array): string {
  return base32Encode(bytes).slice(0, 32);
}

export function generateTotpSecret(options: GenerateTotpSecretOptions = {}): string {
  const size = Math.max(16, options.size ?? 20);
  const bytes = randomBytes(size);
  return toBase32Secret(bytes);
}

function hotp(secret: Uint8Array, counter: number, digits: number): number {
  const buffer = Buffer.allocUnsafe(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac('sha1', Buffer.from(secret)).update(buffer).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  const otp = binary % 10 ** digits;
  return otp;
}

function normalizeToken(token: string): string {
  return token.replace(/\s+/gu, '');
}

export function verifyTotpToken(
  secretBase32: string,
  token: string,
  options: VerifyTotpOptions = {}
): boolean {
  const normalizedToken = normalizeToken(token);
  if (normalizedToken.length === 0) {
    return false;
  }

  const window = Math.max(0, options.window ?? 1);
  const stepSeconds = options.stepSeconds ?? DEFAULT_STEP_SECONDS;
  const digits = options.digits ?? DEFAULT_DIGITS;
  const timestamp = options.timestamp ?? Date.now();

  const counter = Math.floor(timestamp / 1000 / stepSeconds);
  const secretBytes = base32Decode(secretBase32);

  for (let offset = -window; offset <= window; offset += 1) {
    const currentCounter = counter + offset;
    if (currentCounter < 0) {
      continue;
    }

    const code = hotp(secretBytes, currentCounter, digits).toString().padStart(digits, '0');
    if (code === normalizedToken) {
      return true;
    }
  }

  return false;
}

export function buildTotpUri(params: {
  readonly secret: string;
  readonly accountName: string;
  readonly issuer: string;
  readonly digits?: number;
  readonly period?: number;
}): string {
  const url = new URL(`otpauth://totp/${encodeURIComponent(`${params.issuer}:${params.accountName}`)}`);
  url.searchParams.set('secret', params.secret);
  url.searchParams.set('issuer', params.issuer);
  url.searchParams.set('digits', String(params.digits ?? DEFAULT_DIGITS));
  url.searchParams.set('period', String(params.period ?? DEFAULT_STEP_SECONDS));
  return url.toString();
}

function formatRecoveryCode(code: string): string {
  const normalized = code.toUpperCase();
  const segments: string[] = [];
  for (let i = 0; i < normalized.length; i += RECOVERY_CODE_BLOCK_SIZE) {
    segments.push(normalized.slice(i, i + RECOVERY_CODE_BLOCK_SIZE));
  }
  return segments.join('-');
}

export function normalizeRecoveryCodeInput(input: string): string | null {
  const cleaned = input.replace(/[^A-Za-z0-9]/gu, '').toUpperCase();
  if (cleaned.length !== RECOVERY_CODE_BLOCK_SIZE * 4) {
    return null;
  }
  return formatRecoveryCode(cleaned);
}

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const bytes = randomBytes(8).toString('hex').toUpperCase();
    codes.push(formatRecoveryCode(bytes.slice(0, 16)));
  }
  return codes;
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function hashRememberDeviceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
