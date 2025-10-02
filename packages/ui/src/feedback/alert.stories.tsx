import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './alert';

const meta: Meta<typeof Alert> = {
  title: 'Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: {
    title: 'Informational alert',
    description: 'Provide helpful context to the user.',
  },
};

export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="space-y-4">
      <Alert {...args} variant="info" />
      <Alert {...args} variant="success" />
      <Alert {...args} variant="warning" />
      <Alert {...args} variant="error" />
    </div>
  ),
};
