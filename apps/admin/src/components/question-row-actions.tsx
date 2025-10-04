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
import type { QuestionRecord } from '@brainliest/db';
import { deleteQuestionAction, updateQuestionAction } from '@/app/(panel)/content/questions/actions';
import { QuestionForm } from './question-form';

interface QuestionRowActionsProps {
  readonly question: QuestionRecord;
  readonly subjects: ReadonlyArray<SearchableSelectOption>;
}

export function QuestionRowActions({ question, subjects }: QuestionRowActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteQuestionAction(question.id);
      if (result.status === 'success') {
        setDeleteOpen(false);
        setErrorMessage(null);
        router.refresh();
      } else {
        setErrorMessage(result.message ?? 'Unable to delete question. Please try again.');
      }
    });
  };

  const formId = useMemo(() => `question-form-${question.id}`, [question.id]);

  const defaultValues = useMemo(
    () => ({
      id: question.id,
      text: question.stemMarkdown,
      explanation: question.explanationMarkdown ?? '',
      allowMultiple: question.type === 'multi',
      difficulty: question.difficulty,
      subjectSlug: question.subjectSlug,
      examSlug: question.examSlug ?? undefined,
      domain: question.domain ?? undefined,
      source: question.source ?? undefined,
      year: question.year ?? undefined,
      status: question.published ? 'published' : 'draft',
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
        contentMarkdown: option.contentMarkdown,
        isCorrect: option.isCorrect,
      })),
    }),
    [question]
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
            <span className="sr-only">Question actions</span>
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
        title="Edit question"
        size="xl"
      >
        <QuestionForm
          action={updateQuestionAction}
          subjects={subjects}
          defaultValues={defaultValues}
          submitLabel="Save changes"
          headline="Question details"
          description="Manage content, metadata, and answer options for this question."
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
