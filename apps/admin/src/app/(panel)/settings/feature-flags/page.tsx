import { AdminShell } from '@/components/admin-shell';
import { ComingSoon } from '@/components/coming-soon';

const DESCRIPTION = 'Toggle platform capabilities with auditable change notes.';

export default function FeatureFlagsPage() {
  return (
    <AdminShell
      title="Feature Flags"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/settings/feature-flags' },
        { label: 'Feature Flags', href: '/settings/feature-flags', isCurrent: true },
      ]}
    >
      <ComingSoon
        title="Feature flag controls planned"
        description="Targeting rules, rollout history, and approvals are part of the upcoming settings update."
        icon="ToggleLeft"
      />
    </AdminShell>
  );
}
