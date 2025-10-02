import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './modal';
import { Button } from '../primitives/button';

type ModalProps = ComponentProps<typeof Modal>;

const ModalPlayground = (props: ModalProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        {...props}
        isOpen={open}
        onClose={() => setOpen(false)}
        footer={
          props.footer ?? (
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Send invite</Button>
            </div>
          )
        }
      >
        {props.children ?? (
          <div className="space-y-3 text-sm text-gray-600">
            <p>Use the link below to invite teammates. You can revoke access at any time.</p>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              https://brainliest.com/invite/abc123
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

const meta: Meta<typeof Modal> = {
  title: 'Composites/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
  },
  args: {
    title: 'Invite teammates',
    description: 'Share a link to let collaborators join this workspace.',
    size: 'md',
    closeOnOverlayClick: true,
  },
  render: (args) => <ModalPlayground {...args} />,
};

export default meta;

type Story = StoryObj<typeof Modal>;

export const Playground: Story = {};
