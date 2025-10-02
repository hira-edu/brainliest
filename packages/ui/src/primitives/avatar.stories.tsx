import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './avatar';

type Story = StoryObj<typeof Avatar>;

const meta: Meta<typeof Avatar> = {
  title: 'Primitives/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    fallback: 'AL',
  },
};

export default meta;

export const Default: Story = {};

export const WithImage: Story = {
  args: {
    src: 'https://avatars.githubusercontent.com/u/9919?v=4',
    alt: 'Sample avatar',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
      <Avatar {...args} size="xl" />
    </div>
  ),
};
