"use client";

import { useCallback } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Modal, type ModalProps } from './modal';
import { Button, type ButtonProps } from '../primitives/button';
import { EntityFormActions } from '../forms/entity-form';
import { cn } from '../lib/utils';

interface ButtonOverrideProps extends Omit<ButtonProps, 'children'> {}

interface CrudDialogBaseProps extends Omit<ModalProps, 'footer'> {
  readonly confirmLabel: ReactNode;
  readonly cancelLabel?: ReactNode;
  readonly onConfirm?: () => void;
  readonly onCancel?: () => void;
  readonly confirmButtonProps?: ButtonOverrideProps;
  readonly cancelButtonProps?: ButtonOverrideProps;
  readonly confirmDisabled?: boolean;
  readonly confirmLoading?: boolean;
  readonly formId?: string;
  readonly footer?: ReactNode;
  readonly alignFooter?: ComponentPropsWithoutRef<typeof EntityFormActions>['align'];
}

function CrudDialogBase({
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmButtonProps,
  cancelButtonProps,
  confirmDisabled,
  confirmLoading,
  formId,
  footer,
  alignFooter = 'end',
  ...modalProps
}: CrudDialogBaseProps) {
  const close = modalProps.onClose;

  const createCancelHandler = useCallback(
    (originalOnClick?: ButtonProps['onClick']) =>
      (event: React.MouseEvent<HTMLButtonElement>) => {
        originalOnClick?.(event);
        if (event.defaultPrevented) {
          return;
        }
        onCancel?.();
        close();
      },
    [close, onCancel]
  );

  const createConfirmHandler = useCallback(
    (originalOnClick?: ButtonProps['onClick']) =>
      (event: React.MouseEvent<HTMLButtonElement>) => {
        originalOnClick?.(event);
        if (event.defaultPrevented) {
          return;
        }
        onConfirm?.();
        if (!formId) {
          close();
        }
      },
    [close, formId, onConfirm]
  );

  const { onClick: cancelOnClick, variant: cancelVariant = 'secondary', ...restCancel } = cancelButtonProps ?? {};
  const { onClick: confirmOnClick, variant: confirmVariant = 'primary', type: confirmType, form, className, ...restConfirm } =
    confirmButtonProps ?? {};

  const cancelButton = (
    <Button
      key="cancel"
      type="button"
      variant={cancelVariant}
      onClick={createCancelHandler(cancelOnClick)}
      {...restCancel}
    >
      {cancelLabel}
    </Button>
  );

  const resolvedType: ButtonProps['type'] = formId ? 'submit' : confirmType ?? (form ? 'submit' : 'button');

  const confirmButton = (
    <Button
      key="confirm"
      type={resolvedType}
      form={formId ?? form}
      variant={confirmVariant}
      onClick={createConfirmHandler(confirmOnClick)}
      isLoading={confirmLoading}
      disabled={confirmDisabled}
      className={cn(className)}
      {...restConfirm}
    >
      {confirmLabel}
    </Button>
  );

  const footerContent = footer ?? (
    <EntityFormActions align={alignFooter}>
      {cancelLabel ? cancelButton : null}
      {confirmButton}
    </EntityFormActions>
  );

  return (
    <Modal
      {...modalProps}
      footer={footerContent}
      contentProps={{
        ...modalProps.contentProps,
        className: cn('max-h-[85vh] overflow-y-auto', modalProps.contentProps?.className),
      }}
    >
      {modalProps.children}
    </Modal>
  );
}

export interface CreateDialogProps extends Omit<CrudDialogBaseProps, 'confirmLabel'> {
  readonly confirmLabel?: ReactNode;
}

export function CreateDialog({ confirmLabel = 'Create', ...props }: CreateDialogProps) {
  return <CrudDialogBase {...props} confirmLabel={confirmLabel} />;
}

export interface EditDialogProps extends Omit<CrudDialogBaseProps, 'confirmLabel'> {
  readonly confirmLabel?: ReactNode;
}

export function EditDialog({ confirmLabel = 'Save changes', ...props }: EditDialogProps) {
  return <CrudDialogBase {...props} confirmLabel={confirmLabel} />;
}

export interface DeleteConfirmationProps
  extends Omit<CrudDialogBaseProps, 'confirmLabel' | 'confirmButtonProps'> {
  readonly confirmLabel?: ReactNode;
  readonly confirmButtonProps?: ButtonOverrideProps;
}

export function DeleteConfirmation({
  confirmLabel = 'Delete',
  cancelButtonProps,
  confirmButtonProps,
  ...props
}: DeleteConfirmationProps) {
  const mergedConfirmButtonProps: ButtonOverrideProps = {
    variant: 'danger',
  };
  if (confirmButtonProps) {
    Object.assign(mergedConfirmButtonProps, confirmButtonProps);
  }

  const mergedCancelButtonProps: ButtonOverrideProps = {
    variant: 'secondary',
  };
  if (cancelButtonProps) {
    Object.assign(mergedCancelButtonProps, cancelButtonProps);
  }

  return (
    <CrudDialogBase
      {...props}
      confirmLabel={confirmLabel}
      confirmButtonProps={mergedConfirmButtonProps}
      cancelButtonProps={mergedCancelButtonProps}
    />
  );
}

export type { CrudDialogBaseProps };
