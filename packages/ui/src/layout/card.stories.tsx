import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './card';

const meta: Meta<typeof Card> = {
  title: 'Layout/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    header: (
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Card Header</span>
        <span className="text-xs text-gray-500">Meta</span>
      </div>
    ),
    children: <p className="text-sm text-gray-600">Card body content lives here.</p>,
    footer: (
      <div className="flex justify-end gap-2">
        <button className="text-sm font-medium text-primary-600">Action</button>
      </div>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="grid gap-6 md:grid-cols-3">
      <Card {...args} variant="default" />
      <Card {...args} variant="outlined" />
      <Card {...args} variant="elevated" />
    </div>
  ),
};

export const PaddingOptions: Story = {
  render: (args) => (
    <div className="grid gap-6 md:grid-cols-3">
      <Card {...args} padding="sm" />
      <Card {...args} padding="md" />
      <Card {...args} padding="lg" />
    </div>
  ),
};
