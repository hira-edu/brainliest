import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './dialog';

describe('Dialog', () => {
  const onClose = vi.fn();

  it('renders title and description', () => {
    render(
      <Dialog
        isOpen
        onClose={onClose}
        title="Delete question"
        description="This action cannot be undone."
      />
    );

    expect(
      screen.getByRole('dialog', { name: 'Delete question' })
    ).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('calls onClose when pressing Escape', async () => {
    const user = userEvent.setup();
    render(
      <Dialog
        isOpen
        onClose={onClose}
      />
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders action buttons and triggers handlers', async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();

    render(
      <Dialog
        isOpen
        onClose={onClose}
        actions={[
          { id: 'cancel', label: 'Cancel', onClick: onClose, variant: 'secondary' },
          { id: 'confirm', label: 'Delete', onClick: confirm },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(confirm).toHaveBeenCalled();
  });
});
