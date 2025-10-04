'use client';

import { useCallback, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal } from '@brainliest/ui';
import { CategoryForm } from './category-form';
import { createCategoryAction } from '@/app/(panel)/taxonomy/actions';

export function CategoryCreateButton() {
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
        Create category
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Create category" size="lg">
        <CategoryForm
          action={createCategoryAction}
          submitLabel="Create category"
          headline="Category details"
          description="Manage the highest level taxonomy grouping."
          formId={formId}
          onSuccess={handleSuccess}
          submissionMode="modal"
        />
      </Modal>
    </>
  );
}
