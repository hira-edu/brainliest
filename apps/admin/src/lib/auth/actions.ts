'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { redisKeys } from '@brainliest/config';
import { consumeRateLimit } from '@brainliest/shared/adapters';
import { verifyPassword } from '@brainliest/shared/crypto/password';
import { hashRememberDeviceToken } from '@brainliest/shared/crypto/totp';

import { repositories } from '../repositories';
import { createSessionCookie, deleteSessionCookie, readSession } from './session';
import type { SignInFormState } from './sign-in-state';
import { getRecaptchaConfig, verifyRecaptchaToken } from './recaptcha';
import {
  createRememberDeviceValue,
  generateRememberDeviceToken,
  parseRememberDeviceValue,
  clearRememberDeviceCookie,
  isRememberDeviceExpired,
  setRememberDeviceCookie,
  REMEMBER_DEVICE_COOKIE,
} from './remember-device';
import {
  createTotpChallenge,
  deleteTotpChallenge,
  readTotpChallenge,
} from './totp-challenge';
import { verifyAdminTotpOrRecoveryCode } from './totp-service';
import type { TotpChallengeFormState } from './totp-challenge-state';

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getClientIp(forwarded: string | null, realIp: string | null): string | null {
  if (forwarded && forwarded.trim().length > 0) {
    const [first] = forwarded.split(',');
    return first?.trim() ?? null;
  }
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }
  return null;
}

function normaliseRateLimitComponent(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function formatRetryAfter(seconds: number): string {
  if (seconds <= 0) {
    return 'a few moments';
  }

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

export async function signInAction(
  _state: SignInFormState,
  formData: FormData
): Promise<SignInFormState> {
  const email = getString(formData, 'email');
  const password = getString(formData, 'password');
  const remember = formData.get('remember') === 'on';
  const recaptchaToken = getString(formData, 'recaptchaToken');

  if (email.length === 0 || password.length === 0) {
    return {
      status: 'error',
      message: 'Please provide both email and password.',
      fieldErrors: {
        ...(email.length === 0 ? { email: 'Email is required.' } : {}),
        ...(password.length === 0 ? { password: 'Password is required.' } : {}),
      },
    } satisfies SignInFormState;
  }

  const emailNormalised = email.toLowerCase();

  const headerStore = await headers();
  const forwardedFor = headerStore.get('x-forwarded-for');
  const realIp = headerStore.get('x-real-ip');
  const ipAddress = getClientIp(forwardedFor, realIp);
  const userAgent = headerStore.get('user-agent') ?? null;

  const rateLimitChecks = [];

  const emailComponent = normaliseRateLimitComponent(emailNormalised);

  rateLimitChecks.push(
    consumeRateLimit({
      key: redisKeys.rateLimitAuthEmail(emailComponent),
      limit: 10,
      windowSeconds: 15 * 60,
    })
  );

  if (ipAddress) {
    const ipComponent = normaliseRateLimitComponent(ipAddress);
    rateLimitChecks.push(
      consumeRateLimit({
        key: redisKeys.rateLimitAuth(ipComponent),
        limit: 20,
        windowSeconds: 5 * 60,
      })
    );

    rateLimitChecks.push(
      consumeRateLimit({
        key: redisKeys.rateLimitAuthCredential(emailComponent, ipComponent),
        limit: 5,
        windowSeconds: 5 * 60,
      })
    );
  }

  const rateLimitResults = await Promise.all(rateLimitChecks);
  const blocked = rateLimitResults.find((result) => !result.allowed);

  if (blocked) {
    const retryAfterSeconds = Math.max(1, blocked.retryAfterSeconds);
    const retryMessage = formatRetryAfter(retryAfterSeconds);

    await repositories.auditLogs.log({
      actorType: 'system',
      action: 'auth.sign-in.rate-limit',
      entityType: 'admin_auth_attempt',
      entityId: emailNormalised,
      diff: {
        email: emailNormalised,
        ipAddress: ipAddress ?? null,
        retryAfterSeconds,
      },
      ipAddress,
      userAgent,
    });

    return {
      status: 'error',
      message: `Too many sign-in attempts. Please wait about ${retryMessage} before trying again.`,
      cooldownSeconds: retryAfterSeconds,
    } satisfies SignInFormState;
  }

  const recaptchaConfig = await getRecaptchaConfig();
  if (recaptchaConfig) {
    const verification = await verifyRecaptchaToken({
      token: recaptchaToken,
      remoteIp: ipAddress,
      action: 'admin_sign_in',
      minimumScore: 0.5,
      config: recaptchaConfig,
    });

    if (!verification.success) {
      await repositories.auditLogs.log({
        actorType: 'system',
        action: 'auth.sign-in.recaptcha-blocked',
        entityType: 'admin_auth_attempt',
        entityId: emailNormalised,
        diff: {
          email: emailNormalised,
          ipAddress: ipAddress ?? null,
          errorCodes: verification.errorCodes ?? [],
          action: verification.action ?? null,
          score: verification.score ?? null,
        },
        ipAddress,
        userAgent,
      });

      return {
        status: 'error',
        message: 'We could not verify that you are human. Please try again.',
      } satisfies SignInFormState;
    }
  }

  const admin = await repositories.adminUsers.findByEmail(emailNormalised);
  if (!admin || admin.status !== 'active') {
    return {
      status: 'error',
      message: 'Invalid email or password.',
    } satisfies SignInFormState;
  }

  const validPassword = await verifyPassword(password, admin.passwordHash);
  if (!validPassword) {
    return {
      status: 'error',
      message: 'Invalid email or password.',
    } satisfies SignInFormState;
  }

  const totpEnabled = Boolean(admin.totpSecret && admin.totpEnabledAt);

  if (!totpEnabled) {
    await repositories.adminUsers.updateLastLogin(admin.id, new Date());

    const session = await createSessionCookie(
      { id: admin.id, email: admin.email, role: admin.role },
      {
        remember,
        ipAddress,
        userAgent,
      }
    );

    await repositories.auditLogs.log({
      actorType: 'admin',
      actorId: admin.id,
      action: 'auth.sign-in',
      entityType: 'admin_session',
      entityId: session.sessionId,
      ipAddress,
      userAgent,
    });

    redirect('/dashboard');
  }

  const cookieStore = await cookies();
  const rememberCookieValue = cookieStore.get(REMEMBER_DEVICE_COOKIE)?.value;
  const parsedDevice = parseRememberDeviceValue(rememberCookieValue);

  if (parsedDevice) {
    const deviceRecord = await repositories.adminUsers.findRememberDevice(parsedDevice.deviceId);

    if (
      deviceRecord &&
      !isRememberDeviceExpired(deviceRecord.expiresAt) &&
      deviceRecord.tokenHash === hashRememberDeviceToken(parsedDevice.token)
    ) {
      await repositories.adminUsers.touchRememberDevice(deviceRecord.id, new Date());
      await repositories.adminUsers.updateLastLogin(admin.id, new Date());

      const session = await createSessionCookie(
        { id: admin.id, email: admin.email, role: admin.role },
        {
          remember,
          ipAddress,
          userAgent,
        }
      );

      await repositories.auditLogs.log({
        actorType: 'admin',
        actorId: admin.id,
        action: 'auth.sign-in',
        entityType: 'admin_session',
        entityId: session.sessionId,
        ipAddress,
        userAgent,
        diff: { method: 'remember-device' },
      });

      redirect('/dashboard');
    }

    // Clean up invalid or expired remember-device tokens.
    await clearRememberDeviceCookie();
    await repositories.adminUsers.deleteRememberDevice(parsedDevice.deviceId).catch(() => undefined);
  }

  const challenge = await createTotpChallenge({
    adminId: admin.id,
    email: admin.email,
    rememberSession: remember,
    ipAddress,
    userAgent,
  });

  await repositories.auditLogs.log({
    actorType: 'admin',
    actorId: admin.id,
    action: 'auth.sign-in.mfa-required',
    entityType: 'admin_auth_attempt',
    entityId: challenge.challengeId,
    ipAddress,
    userAgent,
  });

  return {
    status: 'challenge',
    message: 'Enter the 6-digit code from your authenticator app.',
    challenge: {
      id: challenge.challengeId,
      email: challenge.email,
      rememberSession: challenge.rememberSession,
    },
  } satisfies SignInFormState;
}

export async function signOutAction(): Promise<void> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get('x-forwarded-for');
  const realIp = headerStore.get('x-real-ip');
  const ipAddress = getClientIp(forwardedFor, realIp);
  const userAgent = headerStore.get('user-agent') ?? null;

  const session = await readSession();

  if (session) {
    await repositories.auditLogs.log({
      actorType: 'admin',
      actorId: session.adminId,
      action: 'auth.sign-out',
      entityType: 'admin_session',
      entityId: session.sessionId,
      ipAddress: ipAddress ?? session.ipAddress,
      userAgent: userAgent ?? session.userAgent,
    });
  }

  await deleteSessionCookie(session?.sessionId);
  redirect('/sign-in');
}

export async function completeTotpChallengeAction(
  _state: TotpChallengeFormState,
  formData: FormData
): Promise<TotpChallengeFormState> {
  const challengeId = getString(formData, 'challengeId');
  const totpCode = getString(formData, 'code');
  const recoveryCode = getString(formData, 'recoveryCode');
  const rememberDeviceRequested = formData.get('rememberDevice') === 'on';

  if (!challengeId) {
    return {
      status: 'error',
      message: 'Security challenge is missing. Please try signing in again.',
    } satisfies TotpChallengeFormState;
  }

  const challenge = await readTotpChallenge(challengeId);
  if (!challenge) {
    return {
      status: 'error',
      message: 'Security challenge expired. Please sign in again.',
    } satisfies TotpChallengeFormState;
  }

  const codeInput = totpCode || recoveryCode;
  if (!codeInput) {
    return {
      status: 'error',
      message: 'Enter your authenticator or recovery code to continue.',
    } satisfies TotpChallengeFormState;
  }

  const adminRecord = await repositories.adminUsers.findById(challenge.adminId);
  if (!adminRecord || !adminRecord.totpEnabledAt || !adminRecord.totpSecret) {
    await deleteTotpChallenge(challengeId);
    return {
      status: 'error',
      message: 'Multi-factor authentication is not enabled for this account.',
    } satisfies TotpChallengeFormState;
  }

  const verification = await verifyAdminTotpOrRecoveryCode(challenge.adminId, codeInput);
  if (!verification.success) {
    return {
      status: 'error',
      message: verification.reason === 'not-enabled'
        ? 'Multi-factor authentication has been disabled. Please sign in again.'
        : 'Invalid authentication code. Try again or use a recovery code.',
    } satisfies TotpChallengeFormState;
  }

  await deleteTotpChallenge(challengeId);

  await repositories.adminUsers.updateLastLogin(challenge.adminId, new Date());

  await clearRememberDeviceCookie();

  if (rememberDeviceRequested && verification.method === 'totp') {
    const device = generateRememberDeviceToken();
    await repositories.adminUsers.createRememberDevice({
      adminId: challenge.adminId,
      deviceId: device.deviceId,
      tokenHash: device.tokenHash,
      userAgent: challenge.userAgent,
      ipAddress: challenge.ipAddress,
      expiresAt: device.expiresAt,
    });

    const cookieValue = createRememberDeviceValue(device.deviceId, device.token);
    await setRememberDeviceCookie(cookieValue, device.expiresAt);
  }

  const session = await createSessionCookie(
    { id: challenge.adminId, email: challenge.email, role: adminRecord.role },
    {
      remember: challenge.rememberSession,
      ipAddress: challenge.ipAddress,
      userAgent: challenge.userAgent,
    }
  );

  await repositories.auditLogs.log({
    actorType: 'admin',
    actorId: challenge.adminId,
    action: 'auth.sign-in',
    entityType: 'admin_session',
    entityId: session.sessionId,
    ipAddress: challenge.ipAddress,
    userAgent: challenge.userAgent,
    diff: { method: verification.method },
  });

  redirect('/dashboard');
}
