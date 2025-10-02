import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './modal';

describe('Modal', () => {
  const onClose = vi.fn();

  const renderModal = (props = {}) =>
    render(
      <Modal
        isOpen
        onClose={onClose}
        title="Invite team"
        description="Send collaborators a link to join this workspace."
        footer={<button type="button">Done</button>}
        {...props}
      >
        <p>Body content</p>
      </Modal>
    );

  it('renders dialog content when open', () => {
    renderModal();

    expect(
      screen.getByRole('dialog', { name: 'Invite team' })
    ).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('invokes onClose when overlay clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('prevents overlay close when disabled', async () => {
    const user = userEvent.setup();
    renderModal({ closeOnOverlayClick: false });
    onClose.mockClear();

    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);

    expect(onClose).not.toHaveBeenCalled();
  });
});
