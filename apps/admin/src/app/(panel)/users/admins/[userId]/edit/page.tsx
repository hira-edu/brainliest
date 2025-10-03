import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { UserForm, type UserFormProps } from '@/components/user-form';
import { getUserById } from '@/lib/users';
import { updateUserAction } from '../../../actions';

interface UserState {
  readonly status: 'idle' | 'error' | 'success';
  readonly message?: string;
  readonly fieldErrors?: Record<string, string>;
}

interface EditAdminPageProps {
  readonly params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: EditAdminPageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await getUserById(userId);
  return {
    title: user ? `Edit ${user.email} · Admins · Brainliest Admin` : 'Edit admin · Brainliest Admin',
  };
}

const roleOptions = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'SUPERADMIN', label: 'Superadmin' },
] as const;

export default async function EditAdminPage({ params }: EditAdminPageProps) {
  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user || user.role === 'STUDENT') {
    notFound();
  }

  const defaultValues = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    profile: JSON.stringify(user.profile ?? {}, null, 2),
  } satisfies {
    readonly id: string;
    readonly email: string;
    readonly role: string;
    readonly status: string;
    readonly profile: string;
  };

  const handleAction: UserFormProps['action'] = async (state, formData) => {
    const typedAction = updateUserAction as UserFormProps['action'];
    const result: unknown = await typedAction(state, formData);

    if (!result || typeof result !== 'object') {
      return state;
    }

    const candidate = result as Partial<UserState>;
    return {
      status: candidate.status ?? state.status,
      message: candidate.message,
      fieldErrors: candidate.fieldErrors,
    } satisfies UserState;
  };

  return (
    <AdminShell
      title="Edit admin"
      description="Adjust permissions and status for this admin account."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Users', href: '/users/admins' },
        { label: 'Admins', href: '/users/admins' },
        { label: user.email, href: `/users/admins/${user.id}/edit`, isCurrent: true },
      ]}
    >
      <UserForm
        {...{
          action: handleAction,
          roleOptions,
          defaultValues,
          submitLabel: 'Save changes',
          passwordLabel: 'Reset password',
          passwordDescription: 'Leave blank to keep the current password.',
        } satisfies UserFormProps}
      />
    </AdminShell>
  );
}
