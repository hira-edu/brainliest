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
import type { ExamRecord } from '@brainliest/db';
import { deleteExamAction, updateExamAction } from '@/app/(panel)/content/exams/actions';
import { ExamForm } from './exam-form';

interface ExamRowActionsProps {
  readonly exam: ExamRecord;
  readonly subjects: ReadonlyArray<SearchableSelectOption>;
}

export function ExamRowActions({ exam, subjects }: ExamRowActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteExamAction(exam.slug);
      if (result.status === 'success') {
        setDeleteOpen(false);
        setErrorMessage(null);
        router.refresh();
      } else {
        setErrorMessage(result.message ?? 'Unable to delete exam. Please try again.');
      }
    });
  };

  const formId = useMemo(() => `exam-form-${exam.slug}`, [exam.slug]);

  const defaultValues = useMemo(
    () => ({
      slug: exam.slug,
      title: exam.title,
      description: exam.description ?? undefined,
      subjectSlug: exam.subjectSlug,
      difficulty: exam.difficulty ?? undefined,
      durationMinutes: exam.durationMinutes !== null && exam.durationMinutes !== undefined
        ? String(exam.durationMinutes)
        : undefined,
      questionTarget: exam.questionTarget !== null && exam.questionTarget !== undefined
        ? String(exam.questionTarget)
        : undefined,
      status: exam.status,
    }),
    [exam]
  );

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
            <span className="sr-only">Exam actions</span>
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
        title={`Edit ${exam.title}`}
        size="xl"
      >
        <ExamForm
          action={updateExamAction}
          subjects={subjects}
          defaultValues={defaultValues}
          submitLabel="Save changes"
          headline="Exam details"
          description="Configure title, taxonomy, scheduling details, and publishing status."
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
