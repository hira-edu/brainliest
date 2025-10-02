import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from './radio';

type Story = StoryObj<typeof Radio>;

const meta: Meta<typeof Radio> = {
  title: 'Primitives/Radio',
  component: Radio,
  tags: ['autodocs'],
  args: {
    label: 'Option A',
    name: 'choices',
  },
};

export default meta;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    description: 'Supporting information lives here.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
