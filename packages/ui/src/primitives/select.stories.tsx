import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { ComponentProps } from 'react';
import { Select } from './select';

const baseOptions = [
  { value: 'option-one', label: 'Option One' },
  { value: 'option-two', label: 'Option Two' },
  { value: 'option-three', label: 'Option Three' },
];

const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
  tags: ['autodocs'],
  args: {
    ariaLabel: 'Select example',
    options: baseOptions,
    placeholder: 'Select option',
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

type SelectProps = ComponentProps<typeof Select>;

const DefaultSelectStory = (props: SelectProps) => {
  const [value, setValue] = useState<string | undefined>('option-one');

  return <Select {...props} value={value} onValueChange={setValue} />;
};

export const Default: Story = {
  render: (args) => <DefaultSelectStory {...args} />,
};

export const ValidationStates: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Select {...args} state="default" ariaLabel="Default select" />
      <Select {...args} state="error" ariaLabel="Error select" />
      <Select {...args} state="success" ariaLabel="Success select" />
    </div>
  ),
};
