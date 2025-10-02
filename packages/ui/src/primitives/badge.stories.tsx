import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

type Story = StoryObj<typeof Badge>;

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: {
    children: 'Active',
  },
};

export default meta;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge {...args} variant="primary">
        Primary
      </Badge>
      <Badge {...args} variant="secondary">
        Secondary
      </Badge>
      <Badge {...args} variant="success">
        Success
      </Badge>
      <Badge {...args} variant="error">
        Error
      </Badge>
      <Badge {...args} variant="warning">
        Warning
      </Badge>
      <Badge {...args} variant="info">
        Info
      </Badge>
    </div>
  ),
};

export const WithDot: Story = {
  args: {
    dot: true,
  },
};
