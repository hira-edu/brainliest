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
import { deleteSubjectAction } from '@/app/(panel)/taxonomy/actions';

interface SubjectRowActionsProps {
  readonly slug: string;
}

export function SubjectRowActions({ slug }: SubjectRowActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSubjectAction(slug);
      if (result.status === 'success') {
        setDeleteOpen(false);
        setErrorMessage(null);
        router.refresh();
      } else {
        setErrorMessage(result.message ?? 'Unable to delete subject. Please try again.');
      }
    });
  };

  return (
    <>
      <Dropdown
        trigger={
          <Button type="button" variant="ghost" size="sm">
            <Icon name="EllipsisVertical" className="h-4 w-4" aria-hidden />
            <span className="sr-only">Subject actions</span>
          </Button>
        }
      >
        <DropdownItem href={`/taxonomy/subjects/${slug}/edit`}>Edit</DropdownItem>
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
        title="Delete subject"
        description="Deleting a subject detaches related exams and questions from this taxonomy branch."
        confirmLabel={isPending ? 'Deleting…' : 'Delete subject'}
        confirmButtonProps={{ isLoading: isPending }}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-gray-600">
          Ensure dependent exams have been reassigned before deleting.
        </p>
        {errorMessage ? <p className="mt-3 text-sm text-error-700">{errorMessage}</p> : null}
      </DeleteConfirmation>
    </>
  );
}
