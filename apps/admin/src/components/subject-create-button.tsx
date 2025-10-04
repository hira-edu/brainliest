'use client';

import { useCallback, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, type SearchableSelectOption } from '@brainliest/ui';
import { SubjectForm } from './subject-form';
import { createSubjectAction } from '@/app/(panel)/taxonomy/actions';

interface SubjectCreateButtonProps {
  readonly categories: ReadonlyArray<SearchableSelectOption>;
  readonly subcategoriesByCategory: Readonly<Record<string, ReadonlyArray<SearchableSelectOption>>>;
}

export function SubjectCreateButton({ categories, subcategoriesByCategory }: SubjectCreateButtonProps) {
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
        Create subject
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Create subject" size="xl">
        <SubjectForm
          action={createSubjectAction}
          categories={categories}
          subcategoriesByCategory={subcategoriesByCategory}
          submitLabel="Create subject"
          headline="Subject details"
          description="Connect the subject to taxonomy and configure discovery metadata."
          formId={formId}
          onSuccess={handleSuccess}
          submissionMode="modal"
        />
      </Modal>
    </>
  );
}
