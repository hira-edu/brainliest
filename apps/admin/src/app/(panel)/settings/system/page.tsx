import { AdminShell } from '@/components/admin-shell';
import { ComingSoon } from '@/components/coming-soon';

const DESCRIPTION = 'Configure global platform behaviour, authentication, and environment defaults.';

export default function SystemSettingsPage() {
  return (
    <AdminShell
      title="System Settings"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/settings/system' },
        { label: 'System Settings', href: '/settings/system', isCurrent: true },
      ]}
    >
      <ComingSoon
        title="System configuration dashboard pending"
        description="Environment toggles, rate limits, and maintenance windows will appear in the next admin sprint."
        icon="SlidersHorizontal"
      />
    </AdminShell>
  );
}
