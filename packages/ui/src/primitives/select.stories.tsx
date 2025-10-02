import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './select';

type Story = StoryObj<typeof Select>;

const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
  tags: ['autodocs'],
  args: {
    children: [
      <option key="placeholder" value="" disabled>
        Select option
      </option>,
      <option key="one" value="one">
        Option One
      </option>,
      <option key="two" value="two">
        Option Two
      </option>,
    ],
    defaultValue: '',
    'aria-label': 'Select example',
  },
};

export default meta;

export const Default: Story = {};

export const ValidationStates: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Select {...args} state="default" aria-label="Default select" />
      <Select {...args} state="error" aria-label="Error select" />
      <Select {...args} state="success" aria-label="Success select" />
    </div>
  ),
};
