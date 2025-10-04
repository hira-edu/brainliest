'use client';

import { useCallback, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, type SearchableSelectOption } from '@brainliest/ui';
import { ExamForm } from './exam-form';
import { createExamAction } from '@/app/(panel)/content/exams/actions';

interface ExamCreateButtonProps {
  readonly subjects: ReadonlyArray<SearchableSelectOption>;
}

export function ExamCreateButton({ subjects }: ExamCreateButtonProps) {
  const router = useRouter();
  const formId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsOpen(false);
    router.refresh();
  }, [router]);

  return (
    <>
      <Button variant="secondary" size="sm" type="button" onClick={handleOpen}>
        Create exam
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Create exam" size="xl">
        <ExamForm
          action={createExamAction}
          subjects={subjects}
          defaultValues={{ status: 'draft', difficulty: 'MEDIUM' }}
          submitLabel="Create exam"
          headline="Exam details"
          description="Configure title, taxonomy, scheduling details, and publishing status."
          formId={formId}
          onSuccess={handleSuccess}
          submissionMode="modal"
        />
      </Modal>
    </>
  );
}
