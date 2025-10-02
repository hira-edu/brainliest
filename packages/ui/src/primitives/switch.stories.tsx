import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';

type Story = StoryObj<typeof Switch>;

const meta: Meta<typeof Switch> = {
  title: 'Primitives/Switch',
  component: Switch,
  tags: ['autodocs'],
  args: {
    label: 'Enable notifications',
  },
};

export default meta;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    description: 'Receive email and push notifications.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
