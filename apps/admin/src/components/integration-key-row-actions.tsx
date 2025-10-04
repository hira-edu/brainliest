'use client';

import { useCallback, useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  DeleteConfirmation,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  FormField,
  FormLabel,
  Icon,
  Modal,
  Textarea,
} from '@brainliest/ui';
import type { IntegrationKeyRecord } from '@brainliest/db';
import { IntegrationKeyForm } from './integration-key-form';
import {
  rotateIntegrationKeyAction,
  integrationKeyInitialState,
  deleteIntegrationKeyAction,
  type IntegrationKeyFormState,
} from '@/app/(panel)/integrations/keys/actions';

interface IntegrationKeyRowActionsProps {
  readonly integrationKey: IntegrationKeyRecord;
}

export function IntegrationKeyRowActions({ integrationKey }: IntegrationKeyRowActionsProps) {
  const router = useRouter();
  const formId = useId();
  const [isRotateOpen, setRotateOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [formState, setFormState] = useState<IntegrationKeyFormState>(integrationKeyInitialState);
  const [deleteState, setDeleteState] = useState<IntegrationKeyFormState>(integrationKeyInitialState);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, startDelete] = useTransition();

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

  const handleOpenDelete = useCallback(() => {
    setDeleteState(integrationKeyInitialState);
    setDeleteReason('');
    setDeleteOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteOpen(false);
    setDeleteState(integrationKeyInitialState);
    setDeleteReason('');
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    startDelete(async () => {
      const payload = new FormData();
      payload.append('id', integrationKey.id);
      const trimmedReason = deleteReason.trim();
      if (trimmedReason.length > 0) {
        payload.append('reason', trimmedReason);
      }

      const result = await deleteIntegrationKeyAction(integrationKeyInitialState, payload);
      if (result.status === 'success') {
        handleCloseDelete();
        router.refresh();
        return;
      }

      setDeleteState(result);
    });
  }, [deleteReason, handleCloseDelete, integrationKey.id, router]);

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
        <DropdownSeparator />
        <DropdownItem
          className="text-error-600 data-[highlighted]:bg-error-50 data-[highlighted]:text-error-900"
          onSelect={handleOpenDelete}
        >
          Delete key
        </DropdownItem>
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

      <DeleteConfirmation
        isOpen={isDeleteOpen}
        onClose={handleCloseDelete}
        title={`Delete ${integrationKey.name}`}
        description="Deleting this key immediately revokes access for dependent integrations."
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete key'}
        confirmButtonProps={{
          isLoading: isDeleting,
          onClick: (event) => {
            event.preventDefault();
            handleDeleteConfirm();
          },
        }}
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-600">
            This action cannot be undone. Ensure any services using this key are rotated before removal.
          </p>

          <FormField description="Optional rationale shown in the audit log.">
            <FormLabel>Deletion reason</FormLabel>
            <Textarea
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              rows={3}
              placeholder="Explain why this key is being removed (optional)"
            />
          </FormField>

          {deleteState.status === 'error' && deleteState.message ? (
            <p className="text-sm text-error-700">{deleteState.message}</p>
          ) : null}
        </div>
      </DeleteConfirmation>
    </>
  );
}
