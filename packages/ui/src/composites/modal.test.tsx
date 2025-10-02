import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './modal';

describe('Modal', () => {
  const renderModal = (props: Partial<ComponentProps<typeof Modal>> = {}) => {
    const handleClose = vi.fn();
    const utils = render(
      <Modal
        isOpen
        onClose={handleClose}
        title="Invite team"
        description="Send collaborators a link to join this workspace."
        footer={<button type="button">Done</button>}
        overlayProps={{ 'data-testid': 'modal-overlay' }}
        {...props}
      >
        <p>Body content</p>
      </Modal>
    );

    return { handleClose, user: userEvent.setup(), ...utils };
  };

  it('renders dialog content when open', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Invite team' })).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('invokes onClose when overlay clicked', async () => {
    const { user, handleClose } = renderModal();

    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('prevents overlay close when disabled', async () => {
    const { user, handleClose } = renderModal({ closeOnOverlayClick: false });

    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);

    expect(handleClose).not.toHaveBeenCalled();
  });
});
