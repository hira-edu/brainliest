'use client';

import { useCallback, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal } from '@brainliest/ui';
import { IntegrationKeyForm } from './integration-key-form';
import {
  createIntegrationKeyAction,
  integrationKeyInitialState,
  type IntegrationKeyFormState,
} from '@/app/(panel)/integrations/keys/actions';

export function IntegrationKeyCreateButton() {
  const router = useRouter();
  const formId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState<IntegrationKeyFormState>(integrationKeyInitialState);

  const handleOpen = useCallback(() => {
    setFormState(integrationKeyInitialState);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSuccess = useCallback((state: IntegrationKeyFormState) => {
    setFormState(state);
    router.refresh();
  }, [router]);

  return (
    <>
      <Button variant="secondary" size="sm" type="button" onClick={handleOpen}>
        Create key
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Create integration key" size="lg">
        <IntegrationKeyForm
          action={createIntegrationKeyAction}
          mode="create"
          formId={formId}
          onSuccess={handleSuccess}
          defaultValues={{}}
        />
        {formState.secret ? (
          <p className="mt-3 text-xs text-gray-500">
            Copy the secret above before closing this dialog. It will not be retrievable once you dismiss it.
          </p>
        ) : null}
      </Modal>
    </>
  );
}
