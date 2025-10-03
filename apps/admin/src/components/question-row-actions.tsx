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
import { deleteQuestionAction } from '@/app/(panel)/content/questions/actions';

interface QuestionRowActionsProps {
  readonly questionId: string;
}

export function QuestionRowActions({ questionId }: QuestionRowActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteQuestionAction(questionId);
      if (result.status === 'success') {
        setDeleteOpen(false);
        setErrorMessage(null);
        router.refresh();
      } else {
        setErrorMessage(result.message ?? 'Unable to delete question. Please try again.');
      }
    });
  };

  return (
    <>
      <Dropdown
        trigger={
          <Button type="button" variant="ghost" size="sm">
            <Icon name="EllipsisVertical" className="h-4 w-4" aria-hidden />
            <span className="sr-only">Question actions</span>
          </Button>
        }
      >
        <DropdownItem href={`/content/questions/${questionId}/edit`}>Edit</DropdownItem>
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
        title="Delete question"
        description="Deleting this question removes it from all associated exams and practice sessions."
        confirmLabel={isPending ? 'Deleting…' : 'Delete question'}
        confirmButtonProps={{ isLoading: isPending }}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-gray-600">
          This action cannot be undone. Learners will no longer see this question in their practice sets.
        </p>
        {errorMessage ? (
          <p className="mt-3 text-sm text-error-700">{errorMessage}</p>
        ) : null}
      </DeleteConfirmation>
    </>
  );
}
