import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './toast';

describe('Toast', () => {
  const renderToast = (onOpenChange = vi.fn(), variant: ComponentProps<typeof Toast>['variant'] = 'default') =>
    render(
      <ToastProvider>
        <Toast open onOpenChange={onOpenChange} duration={Infinity} variant={variant}>
          <ToastTitle>Saved</ToastTitle>
          <ToastDescription>Your progress has been stored.</ToastDescription>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

  it('renders toast content when open', () => {
    renderToast();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your progress has been stored.')).toBeInTheDocument();
  });

  it('invokes onOpenChange when close button clicked', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderToast(onOpenChange);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('applies variant styling', () => {
    renderToast(vi.fn(), 'success');
    const toast = screen.getByText('Saved').closest('[data-variant]');
    expect(toast).not.toBeNull();
    expect(toast).toHaveAttribute('data-variant', 'success');
    expect(toast?.className ?? '').toContain('border-success-DEFAULT');
  });
});
