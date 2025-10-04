'use client';

import { useCallback, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, type SearchableSelectOption } from '@brainliest/ui';
import { SubcategoryForm } from './subcategory-form';
import { createSubcategoryAction } from '@/app/(panel)/taxonomy/actions';

interface SubcategoryCreateButtonProps {
  readonly categories: ReadonlyArray<SearchableSelectOption>;
  readonly variant?: 'secondary' | 'ghost';
}

export function SubcategoryCreateButton({ categories, variant = 'ghost' }: SubcategoryCreateButtonProps) {
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
      <Button variant={variant} size="sm" type="button" onClick={handleOpen}>
        Create subcategory
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Create subcategory" size="lg">
        <SubcategoryForm
          action={createSubcategoryAction}
          categories={categories}
          submitLabel="Create subcategory"
          headline="Subcategory details"
          description="Attach the subcategory to a category and manage visibility."
          formId={formId}
          onSuccess={handleSuccess}
          submissionMode="modal"
        />
      </Modal>
    </>
  );
}
