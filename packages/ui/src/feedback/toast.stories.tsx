import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from './toast';
import { Button } from '../primitives/button';
import type { ToastProps } from './toast';

const ToastPlayground = () => {
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<ToastProps['variant']>('default');

  const triggerToast = (nextVariant: ToastProps['variant']) => {
    setVariant(nextVariant);
    setOpen(true);
  };

  const variantButtons: ToastProps['variant'][] = [
    'default',
    'success',
    'warning',
    'error',
    'info',
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {variantButtons.map((variantName) => (
          <Button
            key={variantName}
            variant={variant === variantName ? 'primary' : 'ghost'}
            onClick={() => triggerToast(variantName)}
          >
            Show {variantName}
          </Button>
        ))}
      </div>

      <ToastProvider swipeDirection="right">
        <Toast
          open={open}
          onOpenChange={setOpen}
          duration={3500}
          variant={variant}
        >
          <ToastTitle>Progress saved</ToastTitle>
          <ToastDescription>
            We stored your current exam session and synced it across devices.
          </ToastDescription>
          <div className="flex items-center gap-2">
            <ToastAction altText="Undo last action">Undo</ToastAction>
            <ToastClose />
          </div>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </div>
  );
};

const meta: Meta = {
  title: 'Feedback/Toast',
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Playground: Story = {
  render: () => <ToastPlayground />,
};
