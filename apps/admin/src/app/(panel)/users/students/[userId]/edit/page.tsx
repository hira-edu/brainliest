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

interface EditStudentPageProps {
  readonly params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: EditStudentPageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await getUserById(userId);
  return {
    title: user ? `Edit ${user.email} · Students · Brainliest Admin` : 'Edit student · Brainliest Admin',
  };
}

const roleOptions = [{ value: 'STUDENT', label: 'Student' }] as const;

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user || user.role !== 'STUDENT') {
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
      title="Edit student"
      description="Update contact information and access controls for this student."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Users', href: '/users/students' },
        { label: 'Students', href: '/users/students' },
        { label: user.email, href: `/users/students/${user.id}/edit`, isCurrent: true },
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
