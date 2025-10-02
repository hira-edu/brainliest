import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';

type Story = StoryObj<typeof Checkbox>;

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: {
    label: 'Remember me',
  },
};

export default meta;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    description: 'We will keep you signed in on this device.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
