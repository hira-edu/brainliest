import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from './divider';
import { Stack } from './stack';

const meta: Meta<typeof Divider> = {
  title: 'Layout/Divider',
  component: Divider,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args) => (
    <Stack gap="4">
      <div className="text-sm text-gray-600">Above</div>
      <Divider {...args} />
      <div className="text-sm text-gray-600">Below</div>
    </Stack>
  ),
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: (args) => (
    <div className="flex h-12 items-center gap-4">
      <span className="text-sm text-gray-600">Left</span>
      <Divider {...args} />
      <span className="text-sm text-gray-600">Right</span>
    </div>
  ),
};
