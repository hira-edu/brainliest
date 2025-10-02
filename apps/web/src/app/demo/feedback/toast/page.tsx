'use client';

import { useState } from 'react';
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastViewport,
  ToastClose,
  Button,
} from '@brainliest/ui';

export default function ToastDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Toast</h1>
      <p className="text-gray-600">
        Toasts surface lightweight confirmations and alerts without interrupting learners.
      </p>

      <ToastProvider swipeDirection="right">
        <Button onClick={() => setOpen(true)}>Trigger toast</Button>
        <Toast open={open} onOpenChange={setOpen} duration={4000}>
          <ToastTitle>Settings updated</ToastTitle>
          <ToastDescription>Your AI explanation preferences were saved.</ToastDescription>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </div>
  );
}
