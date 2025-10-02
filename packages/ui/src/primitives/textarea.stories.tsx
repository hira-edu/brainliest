import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';

type Story = StoryObj<typeof Textarea>;

const meta: Meta<typeof Textarea> = {
  title: 'Primitives/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  args: {
    placeholder: 'Write your answer...'
  },
};

export default meta;

export const Default: Story = {};

export const ResizeOptions: Story = {
  render: (args) => (
    <div className="space-y-4">
      <Textarea {...args} placeholder="Resize vertical" resize="vertical" />
      <Textarea {...args} placeholder="Resize none" resize="none" />
    </div>
  ),
};
