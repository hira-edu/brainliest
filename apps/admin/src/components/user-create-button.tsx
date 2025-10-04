'use client';

import { useCallback, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, type SearchableSelectOption } from '@brainliest/ui';
import { UserForm } from './user-form';
import { createUserAction } from '@/app/(panel)/users/actions';

interface UserCreateButtonProps {
  readonly buttonLabel: string;
  readonly modalTitle: string;
  readonly roleOptions: ReadonlyArray<SearchableSelectOption>;
  readonly submitLabel: string;
  readonly passwordLabel?: string;
  readonly passwordDescription?: string;
  readonly headline?: string;
  readonly description?: string;
  readonly variant?: 'secondary' | 'ghost';
}

export function UserCreateButton({
  buttonLabel,
  modalTitle,
  roleOptions,
  submitLabel,
  passwordLabel,
  passwordDescription,
  headline = 'User details',
  description = 'Manage account information and access controls.',
  variant = 'secondary',
}: UserCreateButtonProps) {
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
        {buttonLabel}
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="lg">
        <UserForm
          action={createUserAction}
          roleOptions={roleOptions}
          submitLabel={submitLabel}
          passwordLabel={passwordLabel}
          passwordDescription={passwordDescription}
          headline={headline}
          description={description}
          formId={formId}
          onSuccess={handleSuccess}
          submissionMode="modal"
        />
      </Modal>
    </>
  );
}
