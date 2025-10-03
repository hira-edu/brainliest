import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin-shell';
import { UserForm } from '@/components/user-form';
import { createUserAction } from '../../actions';

export const metadata: Metadata = {
  title: 'Create admin · Users · Brainliest Admin',
};

const roleOptions = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'SUPERADMIN', label: 'Superadmin' },
] as const;

export default function NewAdminPage() {
  return (
    <AdminShell
      title="Create admin"
      description="Provision a new admin or editor account and assign the appropriate privileges."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Users', href: '/users/admins' },
        { label: 'Admins', href: '/users/admins' },
        { label: 'Create', href: '/users/admins/new', isCurrent: true },
      ]}
    >
      <UserForm
        action={createUserAction}
        roleOptions={roleOptions}
        submitLabel="Create admin"
        passwordDescription="Provide a temporary password. Share it securely and instruct the admin to rotate it after first sign-in."
      />
    </AdminShell>
  );
}
