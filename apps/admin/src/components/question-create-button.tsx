'use client';

import { useId, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, type SearchableSelectOption } from '@brainliest/ui';
import { QuestionForm } from './question-form';
import { createQuestionAction } from '@/app/(panel)/content/questions/actions';

interface QuestionCreateButtonProps {
  readonly subjects: ReadonlyArray<SearchableSelectOption>;
}

export function QuestionCreateButton({ subjects }: QuestionCreateButtonProps) {
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
        Create question
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Create question" size="xl">
        <QuestionForm
          action={createQuestionAction}
          subjects={subjects}
          initialExamOptions={[]}
          defaultValues={{ status: 'draft', allowMultiple: false }}
          submitLabel="Create question"
          headline="Question blueprint"
          description="Fill in the stem, taxonomy, and answer set. You can revisit and publish once everything is verified."
          formId={formId}
          onSuccess={handleSuccess}
          submissionMode="modal"
        />
      </Modal>
    </>
  );
}
