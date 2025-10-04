import 'server-only';

import { randomUUID } from 'node:crypto';

import { decrypt, encrypt } from '@brainliest/shared/crypto/encryption';
import {
  buildTotpUri,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  normalizeRecoveryCodeInput,
  verifyTotpToken,
} from '@brainliest/shared/crypto/totp';
import { repositories } from '@/lib/repositories';
import { getAdminActor } from './admin-actor';
import type {
  AdminRecoveryCodeRecord,
  RememberDeviceRecord,
} from '@brainliest/db';

const TOTP_SETUP_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_ISSUER = 'Brainliest Admin';

interface TotpSetupTokenPayload {
  readonly version: 1;
  readonly adminId: string;
  readonly secret: string;
  readonly issuedAt: number;
}

async function createSetupToken(payload: TotpSetupTokenPayload): Promise<string> {
  return encrypt(JSON.stringify(payload));
}

async function readSetupToken(token: string): Promise<TotpSetupTokenPayload | null> {
  try {
    const decrypted = await decrypt(token);
    const parsed = JSON.parse(decrypted) as TotpSetupTokenPayload;
    if (parsed.version !== 1) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.error('[auth] failed to parse TOTP setup token', error);
    return null;
  }
}

export interface TotpSetupDetails {
  readonly secret: string;
  readonly otpauthUri: string;
  readonly qrCodeUrl: string;
  readonly setupToken: string;
}

export async function startTotpEnrollment(adminId: string, email: string): Promise<TotpSetupDetails> {
  const secret = generateTotpSecret();
  const otpauthUri = buildTotpUri({ secret, accountName: email, issuer: OTP_ISSUER });
  const setupToken = await createSetupToken({
    version: 1,
    adminId,
    secret,
    issuedAt: Date.now(),
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUri)}`;

  return { secret, otpauthUri, qrCodeUrl, setupToken } satisfies TotpSetupDetails;
}

export interface ConfirmTotpResult {
  readonly recoveryCodes: string[];
}

export async function confirmTotpEnrollment(
  adminId: string,
  setupToken: string,
  code: string
): Promise<ConfirmTotpResult> {
  const payload = await readSetupToken(setupToken);
  if (!payload || payload.adminId !== adminId) {
    throw new Error('Invalid or expired setup token.');
  }

  if (Date.now() - payload.issuedAt > TOTP_SETUP_TOKEN_TTL_MS) {
    throw new Error('Setup token expired. Please restart enrollment.');
  }

  const valid = verifyTotpToken(payload.secret, code, { window: 1 });
  if (!valid) {
    throw new Error('Invalid verification code.');
  }

  const encryptedSecret = await encrypt(payload.secret);
  const enabledAt = new Date();

  const recoveryCodes = generateRecoveryCodes();
  await repositories.adminUsers.enableTotp(adminId, encryptedSecret, enabledAt);
  await repositories.adminUsers.replaceRecoveryCodes(
    adminId,
    recoveryCodes.map((code) => ({ id: randomUUID(), codeHash: hashRecoveryCode(code) }))
  );

  await repositories.adminUsers.deleteRememberDevicesForAdmin(adminId);

  return { recoveryCodes } satisfies ConfirmTotpResult;
}

export async function disableTotp(adminId: string): Promise<void> {
  await repositories.adminUsers.disableTotp(adminId);
}

export type TotpVerificationResult =
  | { success: true; method: 'totp' | 'recovery' }
  | { success: false; reason: 'not-enabled' | 'invalid' };

export async function verifyAdminTotpOrRecoveryCode(
  adminId: string,
  code: string
): Promise<TotpVerificationResult> {
  const secret = await getAdminTotpSecret(adminId);
  if (!secret) {
    return { success: false, reason: 'not-enabled' };
  }

  if (verifyTotpToken(secret, code, { window: 1 })) {
    await repositories.adminUsers.updateTotpUsage(adminId, new Date());
    return { success: true, method: 'totp' };
  }

  const normalizedRecovery = normalizeRecoveryCodeInput(code);
  if (!normalizedRecovery) {
    return { success: false, reason: 'invalid' };
  }

  const hash = hashRecoveryCode(normalizedRecovery);
  const used = await repositories.adminUsers.markRecoveryCodeUsed(adminId, hash, new Date());
  if (!used) {
    return { success: false, reason: 'invalid' };
  }

  await repositories.adminUsers.updateTotpUsage(adminId, new Date());
  return { success: true, method: 'recovery' };
}

export async function regenerateAdminRecoveryCodes(adminId: string): Promise<string[]> {
  const admin = await repositories.adminUsers.findById(adminId);
  if (!admin || !admin.totpSecret) {
    throw new Error('Multi-factor authentication is not enabled.');
  }

  const recoveryCodes = generateRecoveryCodes();
  await repositories.adminUsers.replaceRecoveryCodes(
    adminId,
    recoveryCodes.map((code) => ({ id: randomUUID(), codeHash: hashRecoveryCode(code) }))
  );

  return recoveryCodes;
}

export async function revokeRememberDevice(adminId: string, deviceId: string): Promise<void> {
  const device = await repositories.adminUsers.findRememberDevice(deviceId);
  if (!device || device.adminId !== adminId) {
    throw new Error('Device not found.');
  }
  await repositories.adminUsers.deleteRememberDevice(deviceId);
}

export async function revokeRememberDevices(adminId: string): Promise<void> {
  await repositories.adminUsers.deleteRememberDevicesForAdmin(adminId);
}

export interface AdminMfaStatus {
  readonly enabled: boolean;
  readonly enabledAt: Date | null;
  readonly lastUsedAt: Date | null;
  readonly recoveryCodes: AdminRecoveryCodeRecord[];
  readonly rememberDevices: RememberDeviceRecord[];
}

export async function getAdminMfaStatus(adminId: string): Promise<AdminMfaStatus> {
  const admin = await repositories.adminUsers.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found.');
  }

  const recoveryCodes = await repositories.adminUsers.listRecoveryCodes(adminId);
  const rememberDevices = await repositories.adminUsers.listRememberDevices(adminId);

  return {
    enabled: Boolean(admin.totpSecret && admin.totpEnabledAt),
    enabledAt: admin.totpEnabledAt ?? null,
    lastUsedAt: admin.totpLastUsedAt ?? null,
    recoveryCodes,
    rememberDevices,
  } satisfies AdminMfaStatus;
}

export async function getAdminTotpSecret(adminId: string): Promise<string | null> {
  const admin = await repositories.adminUsers.findById(adminId);
  if (!admin || !admin.totpSecret) {
    return null;
  }

  try {
    return await decrypt(admin.totpSecret);
  } catch (error) {
    console.error('[auth] failed to decrypt TOTP secret', error);
    return null;
  }
}

export async function assertAdminActor(): Promise<{ id: string; email: string }> {
  const actor = await getAdminActor();
  if (!actor) {
    throw new Error('Authentication required.');
  }
  if (!actor.email) {
    throw new Error('Admin email unavailable.');
  }
  return { id: actor.id, email: actor.email };
}
