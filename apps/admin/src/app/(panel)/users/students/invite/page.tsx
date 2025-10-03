import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin-shell';
import { UserForm } from '@/components/user-form';
import { createUserAction } from '../../actions';

export const metadata: Metadata = {
  title: 'Invite student · Users · Brainliest Admin',
};

const roleOptions = [{ value: 'STUDENT', label: 'Student' }] as const;

export default function InviteStudentPage() {
  return (
    <AdminShell
      title="Invite student"
      description="Create a new student account or issue credentials for onboarding."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Users', href: '/users/students' },
        { label: 'Students', href: '/users/students' },
        { label: 'Invite', href: '/users/students/invite', isCurrent: true },
      ]}
    >
      <UserForm
        action={createUserAction}
        roleOptions={roleOptions}
        submitLabel="Invite student"
        passwordLabel="Temporary password"
        passwordDescription="Share this temporary password securely; the student should change it after first sign-in."
      />
    </AdminShell>
  );
}
