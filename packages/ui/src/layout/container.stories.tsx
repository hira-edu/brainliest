import type { Meta, StoryObj } from '@storybook/react';
import { Container } from './container';

const meta: Meta<typeof Container> = {
  title: 'Layout/Container',
  component: Container,
  tags: ['autodocs'],
  args: {
    children: (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-600">
        Container content
      </div>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof Container>;

export const Default: Story = {};

export const Widths: Story = {
  render: (args) => (
    <div className="space-y-6">
      <Container {...args} maxWidth="sm" />
      <Container {...args} maxWidth="md" />
      <Container {...args} maxWidth="lg" />
      <Container {...args} maxWidth="xl" />
      <Container {...args} maxWidth="2xl" />
      <Container {...args} maxWidth="full" />
    </div>
  ),
};
