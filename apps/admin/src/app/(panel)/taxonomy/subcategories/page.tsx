import { AdminShell } from '@/components/admin-shell';
import { ComingSoon } from '@/components/coming-soon';

const DESCRIPTION = 'Manage subcategory mappings for each category and subject group.';

export default function SubcategoriesPage() {
  return (
    <AdminShell
      title="Subcategories"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Taxonomy', href: '/taxonomy/subcategories' },
        { label: 'Subcategories', href: '/taxonomy/subcategories', isCurrent: true },
      ]}
    >
      <ComingSoon
        title="Subcategory tooling in development"
        description="Expect drag-and-drop restructuring, localisation, and bulk activation controls soon."
        icon="GitBranch"
      />
    </AdminShell>
  );
}
