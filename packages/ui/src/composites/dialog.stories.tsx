import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './dialog';
import { Button } from '../primitives/button';

const meta: Meta<typeof Dialog> = {
  title: 'Composites/Dialog',
  component: Dialog,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Dialog>;

export const Confirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Archive entry</Button>
        <Dialog
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Archive entry"
          description="The entry will remain accessible from the archive section."
          actions={[
            { id: 'cancel', label: 'Cancel', onClick: () => setOpen(false), variant: 'secondary' },
            {
              id: 'confirm',
              label: 'Archive',
              onClick: () => setOpen(false),
            },
          ]}
        />
      </>
    );
  },
};
