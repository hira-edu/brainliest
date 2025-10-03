import { AdminShell } from '@/components/admin-shell';
import { ComingSoon } from '@/components/coming-soon';

const DESCRIPTION = 'Schedule in-product announcements and coordinate release notes.';

export default function AnnouncementsPage() {
  return (
    <AdminShell
      title="Announcements"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/settings/announcements' },
        { label: 'Announcements', href: '/settings/announcements', isCurrent: true },
      ]}
    >
      <ComingSoon
        title="Announcement planner underway"
        description="Templates, targeting, and scheduling tools will launch in the settings milestone."
        icon="Megaphone"
      />
    </AdminShell>
  );
}
