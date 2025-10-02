import type { Meta, StoryObj } from '@storybook/react';
import { Menu, type MenuItem } from './menu';

const meta: Meta<typeof Menu> = {
  title: 'Navigation/Menu',
  component: Menu,
  tags: ['autodocs'],
};

export default meta;

const horizontalItems: MenuItem[] = [
  { label: 'Dashboard', href: '#dashboard', isActive: true },
  { label: 'Assignments', href: '#assignments' },
  { label: 'Reports', href: '#reports' },
];

const verticalItems: MenuItem[] = [
  { label: 'Profile', href: '#profile', isActive: true },
  { label: 'Security', href: '#security' },
  { label: 'Integrations', href: '#integrations' },
];

type Story = StoryObj<typeof Menu>;

export const Horizontal: Story = {
  args: {
    items: horizontalItems,
  },
};

export const Vertical: Story = {
  args: {
    items: verticalItems,
    orientation: 'vertical',
  },
};
