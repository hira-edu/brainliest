import type { Meta, StoryObj } from '@storybook/react';
import { FormSection } from './form-section';
import { FormField } from './form-field';
import { Input } from '../primitives/input';

const meta: Meta<typeof FormSection> = {
  title: 'Forms/FormSection',
  component: FormSection,
  tags: ['autodocs'],
  args: {
    title: 'Account preferences',
    description: 'Manage how you receive study reminders and updates.',
    children: [
      <FormField key="email" label="Email notifications">
        <Input placeholder="you@example.com" />
      </FormField>,
      <FormField key="phone" label="Phone number" description="Optional">
        <Input placeholder="(555) 555-5555" />
      </FormField>,
    ],
  },
};

export default meta;

type Story = StoryObj<typeof FormSection>;

export const SingleColumn: Story = {};

export const TwoColumns: Story = {
  args: {
    columns: 2,
  },
};
