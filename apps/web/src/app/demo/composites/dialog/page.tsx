'use client';

import { useState } from 'react';
import { Dialog, Button } from '@brainliest/ui';

export default function DialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Dialog</h1>
      <p className="text-gray-600">
        Dialogs provide quick confirmations for focused decisions while keeping users in context.
      </p>
      <Button onClick={() => setOpen(true)}>Archive session</Button>
      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Archive session"
        description="Archived sessions remain available to admins and can be restored at any time."
        actions={[
          { id: 'cancel', label: 'Cancel', onClick: () => setOpen(false), variant: 'secondary' },
          { id: 'confirm', label: 'Archive', onClick: () => setOpen(false) },
        ]}
      >
        <p className="text-sm text-gray-600">
          Students won’t see archived sessions in their dashboards. Only archive sessions that are complete and will no longer be updated.
        </p>
      </Dialog>
    </div>
  );
}
