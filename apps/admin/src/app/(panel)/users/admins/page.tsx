import { Badge } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { listAdminUsers, countAdminUsersByRole } from '@/lib/admin-users';
import { PaginationControl } from '@/components/pagination-control';
import { UserRowActions } from '@/components/user-row-actions';
import AdminUserFilters from '@/components/admin-user-filters';
import type { AdminUserFiltersInitialValues } from '@/types/filter-values';
import { UserCreateButton } from '@/components/user-create-button';

const DESCRIPTION = 'Audit administrative access, check last activity, and plan staffing updates.';

interface AdminAccountsPageProps {
  readonly searchParams?: Promise<Record<string, string | string[]>>;
}

const ROLE_OPTIONS = ['all', 'VIEWER', 'EDITOR', 'ADMIN', 'SUPERADMIN'] as const;
const STATUS_OPTIONS = ['all', 'active', 'invited', 'suspended'] as const;

const numberFormatter = new Intl.NumberFormat('en-US');
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function parseParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function AdminAccountsPage({ searchParams }: AdminAccountsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const roleParam = parseParam(resolvedSearchParams?.role) ?? 'all';
  const statusParam = parseParam(resolvedSearchParams?.status) ?? 'all';
  const searchParam = parseParam(resolvedSearchParams?.search);
  const pageParam = parseParam(resolvedSearchParams?.page);

  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10)) : 1;
  const searchValue = searchParam?.trim() ?? '';

  const normalizedRole = ROLE_OPTIONS.includes(roleParam as (typeof ROLE_OPTIONS)[number]) && roleParam !== 'all'
    ? (roleParam as 'VIEWER' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN')
    : undefined;

  const normalizedStatus = STATUS_OPTIONS.includes(statusParam as (typeof STATUS_OPTIONS)[number]) && statusParam !== 'all'
    ? (statusParam as 'active' | 'invited' | 'suspended')
    : undefined;

  const adminPage = await listAdminUsers({
    role: normalizedRole,
    status: normalizedStatus,
    page,
    search: searchValue.length > 0 ? searchValue : undefined,
  });

  const [viewerCount, editorCount, adminCount, superadminCount] = await Promise.all([
    countAdminUsersByRole('VIEWER'),
    countAdminUsersByRole('EDITOR'),
    countAdminUsersByRole('ADMIN'),
    countAdminUsersByRole('SUPERADMIN'),
  ]);

  const adminRoleOptions = [
    { value: 'VIEWER', label: 'Viewer' },
    { value: 'EDITOR', label: 'Editor' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPERADMIN', label: 'Superadmin' },
  ];

  const initialFilters: AdminUserFiltersInitialValues = {
    role: normalizedRole ?? 'all',
    status: normalizedStatus ?? 'all',
    search: searchValue,
  };

  return (
    <AdminShell
      title="Admin Accounts"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Users', href: '/users/admins' },
        { label: 'Admin Accounts', href: '/users/admins', isCurrent: true },
      ]}
      pageActions={
        <UserCreateButton
          buttonLabel="Add administrator"
          modalTitle="Create admin"
          roleOptions={adminRoleOptions}
          submitLabel="Create admin"
          passwordDescription="Provide a temporary password. Share it securely and instruct the admin to rotate it after first sign-in."
        />
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Viewers" value={numberFormatter.format(viewerCount)} icon="Eye" />
        <MetricCard label="Editors" value={numberFormatter.format(editorCount)} icon="SquarePen" />
        <MetricCard label="Admins" value={numberFormatter.format(adminCount)} icon="ShieldCheck" />
        <MetricCard label="Superadmins" value={numberFormatter.format(superadminCount)} icon="Crown" />
      </div>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Access log</h2>
          <p className="text-sm text-gray-600">Filter by role to review permissions and ensure coverage.</p>
        </header>

        <AdminUserFilters initialFilters={initialFilters} />

        <DataTable
          data={adminPage.data}
          getRowKey={(admin) => admin.id}
          columns={[
            {
              id: 'email',
              header: 'Email',
              cell: (admin) => (
                <div className="space-y-1">
                  <span className="font-medium text-gray-900">{admin.email}</span>
                  <span className="text-xs text-gray-500">Admin ID: {admin.id.slice(0, 8)}…</span>
                </div>
              ),
            },
            {
              id: 'role',
              header: 'Role',
              cell: (admin) => (
                <Badge variant="secondary">{admin.role}</Badge>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (admin) => (
                <Badge variant={admin.status === 'active' ? 'success' : 'warning'} className="capitalize">
                  {admin.status}
                </Badge>
              ),
            },
            {
              id: 'lastLogin',
              header: 'Last login',
              cell: (admin) => (admin.lastLoginAt ? dateFormatter.format(admin.lastLoginAt) : '—'),
            },
            {
              id: 'createdAt',
              header: 'Created',
              cell: (admin) => dateFormatter.format(admin.createdAt),
            },
            {
              id: 'actions',
              header: 'Actions',
              align: 'right',
              cell: (admin) => (
                <UserRowActions user={admin} roleOptions={adminRoleOptions} />
              ),
            },
          ]}
        />

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 sm:flex-row">
          <span className="text-sm text-gray-600">
            Showing page {adminPage.pagination.page} of {adminPage.pagination.totalPages} ({numberFormatter.format(adminPage.pagination.totalCount)} admins)
          </span>
          <PaginationControl page={adminPage.pagination.page} totalPages={adminPage.pagination.totalPages} />
        </footer>
      </section>
    </AdminShell>
  );
}
