import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import type { CardProps } from '@brainliest/ui';
import { Card } from '@brainliest/ui';

import { getAdminActor } from '@/lib/auth';
import { SignInForm } from '@/components/sign-in-form';
import { getRecaptchaClientConfig } from '@/lib/auth/recaptcha';

export const metadata: Metadata = {
  title: 'Sign in • Brainliest Admin',
  description: 'Access the Brainliest management console.',
};

const cardProps: CardProps = {
  className: 'w-full max-w-md shadow-xl',
  padding: 'lg',
};

export default async function SignInPage() {
  const actor = await getAdminActor();
  if (actor) {
    redirect('/dashboard');
  }

  const recaptchaConfig = await getRecaptchaClientConfig();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <Card {...cardProps}>
        <div className="space-y-6">
          <header className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Brainliest Admin</h1>
            <p className="text-sm text-gray-500">Sign in with your admin credentials to continue.</p>
          </header>

          <SignInForm recaptcha={recaptchaConfig} />
        </div>
      </Card>
    </main>
  );
}
