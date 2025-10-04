'use client';

import { useFormState } from 'react-dom';

import { Button, FormField, FormLabel, Input, Checkbox } from '@brainliest/ui';

import { signInAction } from '@/lib/auth/actions';
import { signInInitialState } from '@/lib/auth/sign-in-state';

export function SignInForm() {
  const [state, formAction] = useFormState(signInAction, signInInitialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.status === 'error' && state.message ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800">
          {state.message}
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

      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
