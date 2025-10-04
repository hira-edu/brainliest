'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  DeleteConfirmation,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  Icon,
  Modal,
  type SearchableSelectOption,
} from '@brainliest/ui';
import type { AdminUserRecord, UserRecord } from '@brainliest/db';
import { deleteUserAction, updateUserAction } from '@/app/(panel)/users/actions';
import { UserForm } from './user-form';

type SupportedUser = UserRecord | AdminUserRecord;

interface UserRowActionsProps {
  readonly user: SupportedUser;
  readonly roleOptions: ReadonlyArray<SearchableSelectOption>;
}

const hasProfile = (user: SupportedUser): user is UserRecord => 'profile' in user;

export function UserRowActions({ user, roleOptions }: UserRowActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUserAction(user.id, user.role);
      if (result.status === 'success') {
        setDeleteOpen(false);
        setErrorMessage(null);
        router.refresh();
      } else {
        setErrorMessage(result.message ?? 'Unable to delete user. Please try again.');
      }
    });
  };

  const formId = useMemo(() => `user-form-${user.id}`, [user.id]);

  const defaultValues = useMemo(() => {
    const profileObject: Record<string, unknown> =
      hasProfile(user) && user.profile && typeof user.profile === 'object'
        ? user.profile
        : {};
    const profileString = Object.keys(profileObject).length > 0
      ? JSON.stringify(profileObject, null, 2)
      : '';

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: profileString,
    };
  }, [user]);

  const handleEditSuccess = useCallback(() => {
    setEditOpen(false);
    router.refresh();
  }, [router]);

  const handleOpenEdit = useCallback(() => {
    setEditOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditOpen(false);
  }, []);

  return (
    <>
      <Dropdown
        trigger={
          <Button type="button" variant="ghost" size="sm">
            <Icon name="EllipsisVertical" className="h-4 w-4" aria-hidden />
            <span className="sr-only">User actions</span>
          </Button>
        }
      >
        <DropdownItem
          onSelect={() => {
            handleOpenEdit();
          }}
        >
          Edit
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          onSelect={() => setDeleteOpen(true)}
          icon={<Icon name="Trash2" className="h-4 w-4 text-error-500" aria-hidden />}
          className="text-error-600"
        >
          Delete
        </DropdownItem>
      </Dropdown>

      <Modal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        title={`Edit ${user.email}`}
        size="lg"
      >
        <UserForm
          action={updateUserAction}
          roleOptions={roleOptions}
          defaultValues={defaultValues}
          submitLabel="Save changes"
          headline="User details"
          description="Manage account information and access controls."
          formId={formId}
          onSuccess={handleEditSuccess}
        />
      </Modal>

      <DeleteConfirmation
        isOpen={isDeleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setErrorMessage(null);
        }}
        title="Delete user"
        description="Deleting this user immediately revokes access across the platform."
        confirmLabel={isPending ? 'Deleting…' : 'Delete user'}
        confirmButtonProps={{ isLoading: isPending }}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-gray-600">
          This action cannot be undone. Ensure the user no longer requires access before deleting.
        </p>
        {errorMessage ? <p className="mt-3 text-sm text-error-700">{errorMessage}</p> : null}
      </DeleteConfirmation>
    </>
  );
}
