import type { Meta, StoryObj } from '@storybook/react';
import { FormLabel } from './form-label';

const meta: Meta<typeof FormLabel> = {
  title: 'Forms/FormLabel',
  component: FormLabel,
  tags: ['autodocs'],
  args: {
    children: 'Label text',
  },
};

export default meta;

type Story = StoryObj<typeof FormLabel>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const OptionalHint: Story = {
  args: {
    optionalHint: 'Optional',
  },
};
