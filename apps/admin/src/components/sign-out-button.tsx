'use client';

import { useTransition } from 'react';

import { Button } from '@brainliest/ui';

import { signOutAction } from '@/lib/auth/actions';

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => {
        startTransition(async () => {
          await signOutAction();
        });
      }}
      disabled={pending}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
