import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './link';

type Story = StoryObj<typeof Link>;

const meta: Meta<typeof Link> = {
  title: 'Primitives/Link',
  component: Link,
  tags: ['autodocs'],
  args: {
    href: '#',
    children: 'Learn more',
  },
};

export default meta;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Link {...args} variant="default">
        Default Link
      </Link>
      <Link {...args} variant="muted">
        Muted Link
      </Link>
      <Link {...args} variant="subtle">
        Subtle Link
      </Link>
    </div>
  ),
};
