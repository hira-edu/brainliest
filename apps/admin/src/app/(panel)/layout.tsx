import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { getAdminActor } from '@/lib/auth';

interface PanelLayoutProps {
  readonly children: ReactNode;
}

export default async function PanelLayout({ children }: PanelLayoutProps) {
  const actor = await getAdminActor();

  if (!actor) {
    redirect('/sign-in');
  }

  return <>{children}</>;
}
