import 'server-only';

import type { IntegrationEnvironment } from '@brainliest/db';
import { repositories } from '@/lib/repositories';

type RecaptchaVersion = 'v2' | 'v3';

export interface RecaptchaServerConfig {
  version: RecaptchaVersion;
  siteKey: string;
  secretKey: string;
}

export interface RecaptchaClientConfig {
  version: RecaptchaVersion;
  siteKey: string;
}

interface VerifyRecaptchaOptions {
  token: string;
  remoteIp?: string | null;
  action?: string;
  minimumScore?: number;
  config?: RecaptchaServerConfig | null;
}

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number | null;
  action?: string | null;
  errorCodes?: string[];
}

const VALID_ENVIRONMENTS: ReadonlySet<IntegrationEnvironment> = new Set([
  'production',
  'staging',
  'development',
]);

function resolveIntegrationEnvironment(): IntegrationEnvironment {
  const override = process.env.ADMIN_INTEGRATION_ENV;
  if (override && VALID_ENVIRONMENTS.has(override as IntegrationEnvironment)) {
    return override as IntegrationEnvironment;
  }

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') {
    return 'production';
  }
  if (vercelEnv === 'preview') {
    return 'staging';
  }

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    return 'production';
  }
  if (nodeEnv === 'test') {
    return 'development';
  }

  return 'development';
}

async function loadIntegrationKey(
  type:
    | 'GOOGLE_RECAPTCHA_V2_SITE'
    | 'GOOGLE_RECAPTCHA_V2_SECRET'
    | 'GOOGLE_RECAPTCHA_V3_SITE'
    | 'GOOGLE_RECAPTCHA_V3_SECRET'
): Promise<string | null> {
  const environment = resolveIntegrationEnvironment();
  return repositories.integrationKeys.getDecryptedValueByType(type, environment);
}

export async function getRecaptchaConfig(): Promise<RecaptchaServerConfig | null> {
  const [v3Site, v3Secret, v2Site, v2Secret] = await Promise.all([
    loadIntegrationKey('GOOGLE_RECAPTCHA_V3_SITE'),
    loadIntegrationKey('GOOGLE_RECAPTCHA_V3_SECRET'),
    loadIntegrationKey('GOOGLE_RECAPTCHA_V2_SITE'),
    loadIntegrationKey('GOOGLE_RECAPTCHA_V2_SECRET'),
  ]);

  if (v3Site && v3Secret) {
    return { version: 'v3', siteKey: v3Site, secretKey: v3Secret } satisfies RecaptchaServerConfig;
  }

  if (v2Site && v2Secret) {
    return { version: 'v2', siteKey: v2Site, secretKey: v2Secret } satisfies RecaptchaServerConfig;
  }

  return null;
}

export async function getRecaptchaClientConfig(): Promise<RecaptchaClientConfig | null> {
  const config = await getRecaptchaConfig();
  if (!config) {
    return null;
  }

  return { version: config.version, siteKey: config.siteKey } satisfies RecaptchaClientConfig;
}

export async function verifyRecaptchaToken(
  options: VerifyRecaptchaOptions
): Promise<RecaptchaVerificationResult> {
  const { token, remoteIp, action = 'admin_sign_in', minimumScore = 0.5 } = options;
  const config = options.config ?? (await getRecaptchaConfig());

  if (!config) {
    return { success: true } satisfies RecaptchaVerificationResult;
  }

  if (!token) {
    return { success: false, errorCodes: ['missing-input-response'] } satisfies RecaptchaVerificationResult;
  }

  const params = new URLSearchParams();
  params.set('secret', config.secretKey);
  params.set('response', token);
  if (remoteIp) {
    params.set('remoteip', remoteIp);
  }

  let payload: RecaptchaVerifyResponse | null = null;

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    payload = (await response.json()) as RecaptchaVerifyResponse;
  } catch (error) {
    console.error('[recaptcha] verification request failed', error);
    return { success: false, errorCodes: ['network-error'] } satisfies RecaptchaVerificationResult;
  }

  if (!payload.success) {
    return {
      success: false,
      errorCodes: payload['error-codes'] ?? ['verification-failed'],
    } satisfies RecaptchaVerificationResult;
  }

  if (config.version === 'v3') {
    const score = typeof payload.score === 'number' ? payload.score : null;
    const reportedAction = payload.action ?? null;

    if (score !== null && score < minimumScore) {
      return {
        success: false,
        score,
        action: reportedAction,
        errorCodes: ['score-too-low'],
      } satisfies RecaptchaVerificationResult;
    }

    if (reportedAction && reportedAction !== action) {
      return {
        success: false,
        score,
        action: reportedAction,
        errorCodes: ['invalid-action'],
      } satisfies RecaptchaVerificationResult;
    }

    return {
      success: true,
      score,
      action: reportedAction,
    } satisfies RecaptchaVerificationResult;
  }

  return { success: true } satisfies RecaptchaVerificationResult;
}
