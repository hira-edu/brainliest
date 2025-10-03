import { AdminShell } from '@/components/admin-shell';
import { ComingSoon } from '@/components/coming-soon';

const DESCRIPTION = 'Upload, tag, and reuse media assets across questions and exams.';

export default function MediaLibraryPage() {
  return (
    <AdminShell
      title="Media Library"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/content/media' },
        { label: 'Media Library', href: '/content/media', isCurrent: true },
      ]}
    >
      <ComingSoon
        title="Media asset manager in progress"
        description="Drag-and-drop uploads, usage analytics, and AI tagging are planned for the media milestone."
        icon="Images"
      />
    </AdminShell>
  );
}
