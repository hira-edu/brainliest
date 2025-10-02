import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './header';
import type { MenuItem } from './menu';
import { Button } from '../primitives/button';

const navigation: MenuItem[] = [
  { label: 'Dashboard', href: '#dashboard', isActive: true },
  { label: 'Practice', href: '#practice' },
  { label: 'Reports', href: '#reports' },
];

const meta: Meta<typeof Header> = {
  title: 'Navigation/Header',
  component: Header,
  tags: ['autodocs'],
  args: {
    logo: (
      <div className="flex items-center gap-2 text-gray-900">
        <span className="text-xl font-semibold">Brainliest</span>
      </div>
    ),
    navigation,
    actions: (
      <div className="flex items-center gap-3">
        <Button variant="ghost">Support</Button>
        <Button size="sm">Sign in</Button>
      </div>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof Header>;

export const Default: Story = {};
