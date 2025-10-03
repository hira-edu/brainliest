import { Button, EmptyState } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { MetricCard } from '@/components/metric-card';

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
      pageActions={
        <Button size="sm" variant="secondary" disabled>
          New announcement
        </Button>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Scheduled" value="0" icon="CalendarClock" />
        <MetricCard label="Live" value="0" icon="Megaphone" />
        <MetricCard label="Archived" value="0" icon="Archive" />
      </div>

      <EmptyState
        icon="Megaphone"
        title="No announcements scheduled"
        description="Announcements power new feature rollouts, maintenance windows, and regional notices. Create an announcement to coordinate messaging across the product."
        action={
          <Button size="sm" variant="primary" disabled>
            Coming soon
          </Button>
        }
      />
    </AdminShell>
  );
}
