import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './form-field';
import { Input } from '../primitives/input';

const meta: Meta<typeof FormField> = {
  title: 'Forms/FormField',
  component: FormField,
  tags: ['autodocs'],
  args: {
    label: 'Email address',
    children: <Input placeholder="you@example.com" />,
  },
};

export default meta;

type Story = StoryObj<typeof FormField>;

export const Vertical: Story = {
  args: {
    description: 'We will use this email to contact you.',
  },
};

export const WithError: Story = {
  args: {
    error: 'Please provide a valid email address',
    required: true,
  },
};

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    description: 'Displayed beside the control on large screens.',
  },
};
