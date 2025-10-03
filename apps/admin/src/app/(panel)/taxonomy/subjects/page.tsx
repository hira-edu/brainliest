import { AdminShell } from '@/components/admin-shell';
import { ComingSoon } from '@/components/coming-soon';

const DESCRIPTION = 'Control subject metadata, difficulty, and relationships to exams.';

export default function SubjectsPage() {
  return (
    <AdminShell
      title="Subjects"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Taxonomy', href: '/taxonomy/subjects' },
        { label: 'Subjects', href: '/taxonomy/subjects', isCurrent: true },
      ]}
    >
      <ComingSoon
        title="Subject administration coming soon"
        description="Editing, tagging, and domain analytics will launch with the taxonomy overhaul."
        icon="GraduationCap"
      />
    </AdminShell>
  );
}
