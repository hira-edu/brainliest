import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './icon';

type Story = StoryObj<typeof Icon>;

const meta: Meta<typeof Icon> = {
  title: 'Primitives/Icon',
  component: Icon,
  tags: ['autodocs'],
  args: {
    name: 'Check',
    size: 'md',
  },
  argTypes: {
    name: {
      control: 'select',
      options: ['Check', 'ArrowRight', 'BookOpen', 'Star'],
    },
  },
};

export default meta;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4 text-primary-600">
      <Icon {...args} size="sm" />
      <Icon {...args} size="md" />
      <Icon {...args} size="lg" />
      <Icon {...args} size="xl" />
    </div>
  ),
};
