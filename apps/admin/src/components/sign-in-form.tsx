'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { Button, FormField, FormLabel, Input, Checkbox, Stack } from '@brainliest/ui';

import { signInAction, completeTotpChallengeAction } from '@/lib/auth/actions';
import {
  signInInitialState,
  type SignInChallengeDetails,
} from '@/lib/auth/sign-in-state';
import { totpChallengeInitialState } from '@/lib/auth/totp-challenge-state';
import type { RecaptchaClientConfig } from '@/lib/auth/recaptcha';

declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void;
      execute(siteKey: string, options?: { action?: string }): Promise<string>;
      render(
        container: HTMLElement,
        options: {
          sitekey: string;
          size?: 'invisible' | 'normal' | 'compact';
          callback?: (token: string) => void;
          'error-callback'?: () => void;
        }
      ): number;
      reset(widgetId?: number): void;
    };
    __recaptchaScriptPromise?: Promise<void>;
  }
}

const RECAPTCHA_ACTION = 'admin_sign_in';

function loadRecaptchaScript(src: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.__recaptchaScriptPromise) {
    return window.__recaptchaScriptPromise;
  }

  window.__recaptchaScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA script.')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA script.'));
    document.head.appendChild(script);
  });

  return window.__recaptchaScriptPromise;
}

interface RecaptchaController {
  ready: boolean;
  error: string | null;
  execute: () => Promise<string | null>;
  containerRef: RefObject<HTMLDivElement>;
  clearError: () => void;
}

interface SignInFormProps {
  recaptcha?: RecaptchaClientConfig | null;
}

function useRecaptchaController(config?: RecaptchaClientConfig | null): RecaptchaController {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const resolverRef = useRef<((token: string | null) => void) | null>(null);
  const rejecterRef = useRef<((reason?: unknown) => void) | null>(null);

  const [ready, setReady] = useState<boolean>(!config);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) {
      setReady(true);
      setError(null);
      return;
    }

    setReady(false);
    setError(null);
    widgetIdRef.current = null;

    const scriptSrc = config.version === 'v3'
      ? `https://www.google.com/recaptcha/api.js?render=${config.siteKey}`
      : 'https://www.google.com/recaptcha/api.js?render=explicit';

    loadRecaptchaScript(scriptSrc)
      .then(() => {
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha) {
          throw new Error('grecaptcha unavailable');
        }

        grecaptcha.ready(() => {
          if (config.version === 'v2') {
            const container = containerRef.current;
            if (!container) {
              setError('Security challenge container is unavailable.');
              return;
            }

            widgetIdRef.current = grecaptcha.render(container, {
              sitekey: config.siteKey,
              size: 'invisible',
              callback: (token: string) => {
                resolverRef.current?.(token);
                resolverRef.current = null;
                rejecterRef.current = null;
                grecaptcha.reset();
              },
              'error-callback': () => {
                rejecterRef.current?.(new Error('recaptcha-error'));
                resolverRef.current = null;
                rejecterRef.current = null;
                setError('Security challenge failed. Please try again.');
              },
            });
          }

          setReady(true);
        });
      })
      .catch((loadError: unknown) => {
        console.error('[recaptcha] failed to load script', loadError);
        setError('Unable to load the security challenge. Please refresh and try again.');
      });
  }, [config]);

  const execute = useCallback(async (): Promise<string | null> => {
    if (!config) {
      return null;
    }

    const grecaptcha = window.grecaptcha;

    if (!grecaptcha || !ready) {
      throw new Error('recaptcha-not-ready');
    }

    if (config.version === 'v3') {
      return grecaptcha.execute(config.siteKey, { action: RECAPTCHA_ACTION });
    }

    return new Promise<string | null>((resolve, reject) => {
      if (widgetIdRef.current === null) {
        reject(new Error('recaptcha-widget-missing'));
        return;
      }

      resolverRef.current = resolve;
      rejecterRef.current = reject;

      try {
        void grecaptcha.execute((widgetIdRef.current ?? undefined) as never);
      } catch (executionError) {
        resolverRef.current = null;
        rejecterRef.current = null;
        reject(executionError);
      }
    });
  }, [config, ready]);

  const clearError = useCallback(() => setError(null), []);

  return { ready: ready || !config, error, execute, containerRef, clearError };
}

function FormActions({ submitLabel, isVerifying = false }: { submitLabel: string; isVerifying?: boolean }) {
  const { pending } = useFormStatus();
  const loading = pending || isVerifying;

  return (
    <div>
      <Button type="submit" className="w-full" isLoading={loading} disabled={loading}>
        {submitLabel}
      </Button>
    </div>
  );
}

export function SignInForm({ recaptcha }: SignInFormProps) {
  const [state, formAction] = useFormState(signInAction, signInInitialState);
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const bypassRef = useRef(false);
  const [challenge, setChallenge] = useState<SignInChallengeDetails | null>(null);
  const [challengeMessage, setChallengeMessage] = useState<string | null>(null);
  const [challengeMode, setChallengeMode] = useState<'totp' | 'recovery'>('totp');
  const [challengeFormState, challengeFormAction] = useFormState(completeTotpChallengeAction, totpChallengeInitialState);

  const {
    ready: recaptchaReady,
    error: recaptchaError,
    execute: executeRecaptcha,
    containerRef,
    clearError,
  } = useRecaptchaController(challenge ? null : recaptcha);

  const [isVerifying, setIsVerifying] = useState(false);
  const [clientCaptchaError, setClientCaptchaError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'challenge' && state.challenge) {
      setChallenge(state.challenge);
      setChallengeMessage(state.message ?? null);
    } else if (state.status !== 'challenge') {
      setClientCaptchaError(null);
      if (state.status === 'idle') {
        setChallenge(null);
        setChallengeMessage(null);
      }
    }
  }, [state]);

  useEffect(() => {
    if (challenge) {
      setChallengeMode('totp');
    }
  }, [challenge]);

  useEffect(() => {
    if (
      challengeFormState.status === 'error' &&
      challengeFormState.message?.toLowerCase().includes('expired')
    ) {
      setChallenge(null);
    }
  }, [challengeFormState]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      if (challenge || !recaptcha) {
        return;
      }

      if (bypassRef.current) {
        bypassRef.current = false;
        return;
      }

      event.preventDefault();

      if (!recaptchaReady) {
        setClientCaptchaError('Security challenge is still preparing. Please try again in a moment.');
        return;
      }

      setIsVerifying(true);
      clearError();
      setClientCaptchaError(null);

      void (async () => {
        try {
          const token = await executeRecaptcha();

          if (!token) {
            setClientCaptchaError('Please complete the security challenge and try again.');
            setIsVerifying(false);
            return;
          }

          if (tokenInputRef.current) {
            tokenInputRef.current.value = token;
          }

          bypassRef.current = true;
          event.currentTarget.requestSubmit();
        } catch (error) {
          console.error('[recaptcha] execution failed', error);
          setClientCaptchaError('Unable to complete the security challenge. Please try again.');
        } finally {
          setIsVerifying(false);
        }
      })();
    },
    [challenge, recaptcha, recaptchaReady, clearError, executeRecaptcha]
  );

  const securityMessage = clientCaptchaError ?? recaptchaError;

  if (challenge) {
    const totpError = challengeFormState.status === 'error' ? challengeFormState.message : null;
    const activeMessage = totpError ?? challengeMessage;

    return (
      <form action={challengeFormAction} className="space-y-6">
        <input type="hidden" name="challengeId" value={challenge.id} />

        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Multi-factor authentication</h1>
          <p className="text-sm text-gray-600">
            Enter the verification code for <span className="font-medium">{challenge.email}</span> to continue.
          </p>
        </header>

        {activeMessage ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {activeMessage}
          </div>
        ) : null}

        <Stack direction="col" gap={3}>
          {challengeMode === 'totp' ? (
            <FormField error={challengeFormState.fieldErrors?.code}>
              <FormLabel>Authenticator code</FormLabel>
              <Input
                key="totp"
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={6}
                required
              />
              <p className="mt-1 text-xs text-gray-500">Open your authenticator app and enter the 6-digit code.</p>
            </FormField>
          ) : (
            <FormField error={challengeFormState.fieldErrors?.recoveryCode}>
              <FormLabel>Recovery code</FormLabel>
              <Input
                key="recovery"
                type="text"
                name="recoveryCode"
                autoComplete="off"
                placeholder="ABCD-EFGH-IJKL"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Use one of your one-time recovery codes if you cannot access the app.</p>
            </FormField>
          )}

          <div className="text-right">
            <button
              type="button"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
              onClick={() => setChallengeMode((mode) => (mode === 'totp' ? 'recovery' : 'totp'))}
            >
              {challengeMode === 'totp' ? 'Use a recovery code' : 'Use authenticator code'}
            </button>
          </div>

          <FormField>
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <Checkbox name="rememberDevice" />
              <span>Trust this device for 30 days</span>
            </label>
          </FormField>
        </Stack>

        <FormActions submitLabel="Verify and continue" />
      </form>
    );
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      {state.status === 'error' && state.message ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800">
          {state.message}
        </div>
      ) : null}

      {securityMessage ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {securityMessage}
        </div>
      ) : null}

      <FormField error={state.fieldErrors?.email}>
        <FormLabel>Email</FormLabel>
        <Input
          type="email"
          name="email"
          autoCapitalize="none"
          autoComplete="email"
          autoFocus
          required
          placeholder="you@example.com"
        />
      </FormField>

      <FormField error={state.fieldErrors?.password}>
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </FormField>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <label className="inline-flex items-center gap-2">
          <Checkbox name="remember" />
          <span>Remember for 30 days</span>
        </label>
        <span className="text-gray-400">Need access? Contact the platform team.</span>
      </div>

      <input ref={tokenInputRef} type="hidden" name="recaptchaToken" />
      {recaptcha ? <div ref={containerRef} className="sr-only" aria-hidden="true" /> : null}

      <FormActions submitLabel="Sign in" isVerifying={isVerifying} />
    </form>
  );
}
