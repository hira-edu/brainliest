'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  DeleteConfirmation,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  Icon,
} from '@brainliest/ui';
import { deleteUserAction } from '@/app/(panel)/users/actions';

interface UserRowActionsProps {
  readonly userId: string;
  readonly role: string;
}

function segmentForRole(role: string): 'students' | 'admins' {
  return role.toUpperCase() === 'STUDENT' ? 'students' : 'admins';
}

export function UserRowActions({ userId, role }: UserRowActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUserAction(userId, role);
      if (result.status === 'success') {
        setDeleteOpen(false);
        setErrorMessage(null);
        router.refresh();
      } else {
        setErrorMessage(result.message ?? 'Unable to delete user. Please try again.');
      }
    });
  };

  const segment = segmentForRole(role);

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
        <DropdownItem href={`/users/${segment}/${userId}/edit`}>Edit</DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          onSelect={() => setDeleteOpen(true)}
          icon={<Icon name="Trash2" className="h-4 w-4 text-error-500" aria-hidden />}
          className="text-error-600"
        >
          Delete
        </DropdownItem>
      </Dropdown>

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
