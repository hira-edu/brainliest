'use client';

import { useCallback, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dropdown,
  DropdownItem,
  Icon,
  Modal,
} from '@brainliest/ui';
import type { IntegrationKeyRecord } from '@brainliest/db';
import { IntegrationKeyForm } from './integration-key-form';
import {
  rotateIntegrationKeyAction,
  integrationKeyInitialState,
  type IntegrationKeyFormState,
} from '@/app/(panel)/integrations/keys/actions';

interface IntegrationKeyRowActionsProps {
  readonly integrationKey: IntegrationKeyRecord;
}

export function IntegrationKeyRowActions({ integrationKey }: IntegrationKeyRowActionsProps) {
  const router = useRouter();
  const formId = useId();
  const [isRotateOpen, setRotateOpen] = useState(false);
  const [formState, setFormState] = useState<IntegrationKeyFormState>(integrationKeyInitialState);

  const handleOpenRotate = useCallback(() => {
    setFormState(integrationKeyInitialState);
    setRotateOpen(true);
  }, []);

  const handleCloseRotate = useCallback(() => {
    setRotateOpen(false);
  }, []);

  const handleRotateSuccess = useCallback((state: IntegrationKeyFormState) => {
    setFormState(state);
    router.refresh();
  }, [router]);

  return (
    <>
      <Dropdown
        trigger={
          <Button variant="ghost" size="sm" type="button">
            <Icon name="EllipsisVertical" className="h-4 w-4" aria-hidden />
            <span className="sr-only">Integration key actions</span>
          </Button>
        }
      >
        <DropdownItem onSelect={handleOpenRotate}>Rotate key</DropdownItem>
      </Dropdown>

      <Modal
        isOpen={isRotateOpen}
        onClose={handleCloseRotate}
        title={`Rotate ${integrationKey.name}`}
        size="lg"
      >
        <IntegrationKeyForm
          action={rotateIntegrationKeyAction}
          mode="rotate"
          formId={formId}
          defaultValues={{
            id: integrationKey.id,
            name: integrationKey.name,
            type: integrationKey.type,
            environment: integrationKey.environment,
            description: integrationKey.description ?? undefined,
          }}
          onSuccess={handleRotateSuccess}
        />
        {formState.secret ? (
          <p className="mt-3 text-xs text-gray-500">
            Distribute the rotated secret to dependent services. The previous value is now invalid.
          </p>
        ) : null}
      </Modal>
    </>
  );
}
