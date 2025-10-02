import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Icon } from './icon';

type Story = StoryObj<typeof Input>;

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    placeholder: 'Type something...'
  },
};

export default meta;

export const Default: Story = {};

export const WithAddons: Story = {
  args: {
    leftAddon: <Icon name="Search" aria-hidden />, 
    rightAddon: <span className="text-xs text-gray-500">⌘K</span>,
    placeholder: 'Search exams',
    'aria-label': 'Search input',
  },
};

export const ValidationStates: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Input {...args} placeholder="Default" state="default" />
      <Input {...args} placeholder="Error" state="error" />
      <Input {...args} placeholder="Success" state="success" />
    </div>
  ),
};
