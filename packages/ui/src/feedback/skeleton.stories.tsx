import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    className: 'h-6 w-48',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton variant="text" className="w-32" />
      <Skeleton variant="rectangular" className="h-16 w-24" />
      <Skeleton variant="circular" className="h-16 w-16" />
    </div>
  ),
};
