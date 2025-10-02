import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './progress';

const meta: Meta<typeof Progress> = {
  title: 'Feedback/Progress',
  component: Progress,
  tags: ['autodocs'],
  args: {
    value: 45,
    max: 100,
  },
};

export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="space-y-4">
      <Progress {...args} variant="default" />
      <Progress {...args} variant="success" />
      <Progress {...args} variant="warning" />
      <Progress {...args} variant="error" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="space-y-4">
      <Progress {...args} size="sm" />
      <Progress {...args} size="md" />
      <Progress {...args} size="lg" />
    </div>
  ),
};
