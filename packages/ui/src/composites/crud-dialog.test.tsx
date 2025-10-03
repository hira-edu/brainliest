import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateDialog, DeleteConfirmation, EditDialog } from './crud-dialog';

function renderOpen(element: ReactElement) {
  return render(element);
}

describe('CRUD dialogs', () => {
  it('renders title and calls confirm handler', async () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();
    const user = userEvent.setup();

    renderOpen(
      <CreateDialog
        isOpen
        onClose={handleClose}
        title="Create question"
        onConfirm={handleConfirm}
      >
        <p>Body</p>
      </CreateDialog>
    );

    expect(screen.getByRole('heading', { name: 'Create question' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not close automatically when formId provided', async () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();
    const user = userEvent.setup();
    renderOpen(
      <EditDialog
        isOpen
        onClose={handleClose}
        title="Edit question"
        onConfirm={handleConfirm}
        formId="question-form"
        confirmButtonProps={{ type: 'button' }}
      >
        <p>Example</p>
      </EditDialog>
    );

    const confirmButton = await screen.findByRole('button', { name: 'Save changes' });
    await user.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('uses danger styling for delete confirmation', async () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();
    const user = userEvent.setup();

    renderOpen(
      <DeleteConfirmation
        isOpen
        onClose={handleClose}
        title="Delete"
        description="This action cannot be undone"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        <p>Content</p>
      </DeleteConfirmation>
    );

    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    expect(confirmButton.className).toContain('bg-error');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
