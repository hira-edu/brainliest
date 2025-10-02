'use client';

import { useState } from 'react';
import { Modal, Button } from '@brainliest/ui';

export default function ModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Modal</h1>
      <p className="text-gray-600">
        The modal component is powered by Radix Dialog primitives to deliver accessible overlays for deep focus tasks.
      </p>
      <div>
        <Button onClick={() => setOpen(true)}>Invite teammates</Button>
      </div>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Invite teammates"
        description="Share a link with collaborators so they can join this workspace."
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Send invite</Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-gray-600">
          <p>Copy the shareable link below and send it to your teammates. They will get instant access once they sign in.</p>
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-xs text-gray-500">
            https://brainliest.com/invite/ai-certification
          </div>
        </div>
      </Modal>
    </div>
  );
}
