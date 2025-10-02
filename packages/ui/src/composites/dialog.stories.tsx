import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './dialog';
import { Button } from '../primitives/button';

type DialogProps = ComponentProps<typeof Dialog>;

const DialogPlayground = (props: DialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Archive entry</Button>
      <Dialog
        {...props}
        isOpen={open}
        onClose={() => setOpen(false)}
        actions={
          props.actions ?? [
            { id: 'cancel', label: 'Cancel', onClick: () => setOpen(false), variant: 'secondary' },
            {
              id: 'confirm',
              label: 'Archive',
              onClick: () => setOpen(false),
            },
          ]
        }
      />
    </>
  );
};

const meta: Meta<typeof Dialog> = {
  title: 'Composites/Dialog',
  component: Dialog,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Dialog>;

export const Confirmation: Story = {
  args: {
    title: 'Archive entry',
    description: 'The entry will remain accessible from the archive section.',
  },
  render: (args) => <DialogPlayground {...args} />,
};
