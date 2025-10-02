import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './toast';
import { Button } from '../primitives/button';

const meta: Meta = {
  title: 'Feedback/Toast',
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Playground: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <ToastProvider swipeDirection="right">
        <Button onClick={() => setOpen(true)}>Show toast</Button>
        <Toast
          open={open}
          onOpenChange={setOpen}
          duration={3000}
        >
          <ToastTitle>Progress saved</ToastTitle>
          <ToastDescription>We stored your current exam session.</ToastDescription>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
  },
};
