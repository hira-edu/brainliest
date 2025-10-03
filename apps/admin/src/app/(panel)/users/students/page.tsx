import Link from 'next/link';
import { Badge, Button } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { listUsers, countUsersByRole, countUsersByStatus } from '@/lib/users';
import { PaginationControl } from '@/components/pagination-control';
import { UserRowActions } from '@/components/user-row-actions';
import StudentUserFilters from '@/components/student-user-filters';
import type { StudentUserFiltersInitialValues } from '@/types/filter-values';

const DESCRIPTION = 'Monitor student accounts, investigate status changes, and keep growth metrics in view.';

interface StudentsPageProps {
  readonly searchParams?: Promise<Record<string, string | string[]>>;
}

const STATUS_OPTIONS = ['all', 'active', 'suspended', 'banned'] as const;
const SUBSCRIPTION_OPTIONS = ['all', 'free', 'standard', 'premium', 'team'] as const;

const numberFormatter = new Intl.NumberFormat('en-US');
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

function parseParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const statusParam = parseParam(resolvedSearchParams?.status) ?? 'all';
  const subscriptionParam = parseParam(resolvedSearchParams?.subscription) ?? 'all';
  const searchParam = parseParam(resolvedSearchParams?.search);
  const pageParam = parseParam(resolvedSearchParams?.page);

  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10)) : 1;
  const searchValue = searchParam?.trim() ?? '';

  const normalizedStatus = STATUS_OPTIONS.includes(statusParam as (typeof STATUS_OPTIONS)[number]) && statusParam !== 'all'
    ? statusParam
    : undefined;

  const normalizedSubscription =
    SUBSCRIPTION_OPTIONS.includes(subscriptionParam as (typeof SUBSCRIPTION_OPTIONS)[number]) && subscriptionParam !== 'all'
      ? subscriptionParam
      : undefined;

  const studentsPage = await listUsers({
    role: 'STUDENT',
    status: normalizedStatus,
    subscriptionTier: normalizedSubscription,
    page,
    search: searchValue.length > 0 ? searchValue : undefined,
  });

  const [totalStudents, activeStudents, suspendedStudents] = await Promise.all([
    countUsersByRole('STUDENT'),
    countUsersByStatus('STUDENT', 'active'),
    countUsersByStatus('STUDENT', 'suspended'),
  ]);

  const initialFilters: StudentUserFiltersInitialValues = {
    status: normalizedStatus ?? 'all',
    subscriptionTier: normalizedSubscription ?? 'all',
    search: searchValue,
  };

  return (
    <AdminShell
      title="Students"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Users', href: '/users/students' },
        { label: 'Students', href: '/users/students', isCurrent: true },
      ]}
      pageActions={
        <Button variant="secondary" size="sm" asChild>
          <Link href="/users/students/invite">Invite student</Link>
        </Button>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total students" value={numberFormatter.format(totalStudents)} icon="Users" />
        <MetricCard label="Active" value={numberFormatter.format(activeStudents)} icon="UserCheck" />
        <MetricCard label="Suspended" value={numberFormatter.format(suspendedStudents)} icon="UserX" />
        <MetricCard label="Page results" value={numberFormatter.format(studentsPage.pagination.totalCount)} icon="List" />
      </div>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Student directory</h2>
          <p className="text-sm text-gray-600">Filter by status to focus on intervention workflows.</p>
        </header>

        <StudentUserFilters initialFilters={initialFilters} />

        <DataTable
          data={studentsPage.data}
          getRowKey={(user) => user.id}
          columns={[
            {
              id: 'email',
              header: 'Email',
              cell: (user) => (
                <div className="space-y-1">
                  <span className="font-medium text-gray-900">{user.email}</span>
                  <span className="text-xs text-gray-500">User ID: {user.id.slice(0, 8)}…</span>
                </div>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (user) => (
                <Badge variant={user.status === 'active' ? 'success' : 'warning'} className="capitalize">
                  {user.status}
                </Badge>
              ),
            },
            {
              id: 'role',
              header: 'Role',
              cell: (user) => user.role,
            },
            {
              id: 'createdAt',
              header: 'Joined',
              cell: (user) => dateFormatter.format(user.createdAt),
            },
            {
              id: 'updatedAt',
              header: 'Updated',
              cell: (user) => dateFormatter.format(user.updatedAt),
            },
            {
              id: 'actions',
              header: 'Actions',
              align: 'right',
              cell: (user) => <UserRowActions userId={user.id} role={user.role} />,
            },
          ]}
        />

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 sm:flex-row">
          <span className="text-sm text-gray-600">
            Showing page {studentsPage.pagination.page} of {studentsPage.pagination.totalPages} ({numberFormatter.format(studentsPage.pagination.totalCount)} students)
          </span>
          <PaginationControl page={studentsPage.pagination.page} totalPages={studentsPage.pagination.totalPages} />
        </footer>
      </section>
    </AdminShell>
  );
}
