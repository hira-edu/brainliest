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
import { deleteExamAction } from '@/app/(panel)/content/exams/actions';

interface ExamRowActionsProps {
  readonly slug: string;
}

export function ExamRowActions({ slug }: ExamRowActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteExamAction(slug);
      if (result.status === 'success') {
        setDeleteOpen(false);
        setErrorMessage(null);
        router.refresh();
      } else {
        setErrorMessage(result.message ?? 'Unable to delete exam. Please try again.');
      }
    });
  };

  return (
    <>
      <Dropdown
        trigger={
          <Button type="button" variant="ghost" size="sm">
            <Icon name="EllipsisVertical" className="h-4 w-4" aria-hidden />
            <span className="sr-only">Exam actions</span>
          </Button>
        }
      >
        <DropdownItem href={`/content/exams/${slug}/edit`}>Edit</DropdownItem>
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
        title="Delete exam"
        description="Deleting this exam removes it from catalog discovery and practice assignments."
        confirmLabel={isPending ? 'Deleting…' : 'Delete exam'}
        confirmButtonProps={{ isLoading: isPending }}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-gray-600">
          This action cannot be undone. Learners will no longer see this exam in scheduling workflows.
        </p>
        {errorMessage ? <p className="mt-3 text-sm text-error-700">{errorMessage}</p> : null}
      </DeleteConfirmation>
    </>
  );
}
