import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { TotpManager } from '@/components/totp-manager';
import { getAdminActor } from '@/lib/auth';
import { getAdminMfaStatus } from '@/lib/auth/totp-service';

const DESCRIPTION = 'Manage multi-factor authentication, recovery codes, and trusted device settings for your admin account.';

export default async function SecuritySettingsPage() {
  const actor = await getAdminActor();
  if (!actor) {
    redirect('/sign-in');
  }

  const mfaStatus = await getAdminMfaStatus(actor.id);

  return (
    <AdminShell
      title="Security"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/settings/security' },
        { label: 'Security', href: '/settings/security', isCurrent: true },
      ]}
    >
      <TotpManager status={mfaStatus} email={actor.email ?? actor.id} />
    </AdminShell>
  );
}
