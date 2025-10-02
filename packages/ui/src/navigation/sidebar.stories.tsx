import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar, type SidebarItem } from './sidebar';
import { Badge } from '../primitives/badge';

const sampleItems: SidebarItem[] = [
  { label: 'Dashboard', href: '#dashboard', isActive: true, icon: '🏠' },
  { label: 'Assignments', href: '#assignments', icon: '📝', badge: <Badge variant="secondary">12</Badge> },
  { label: 'Practice Sets', href: '#practice', icon: '🧠' },
  { label: 'Analytics', href: '#analytics', icon: '📊' },
];

const meta: Meta<typeof Sidebar> = {
  title: 'Navigation/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  args: {
    header: (
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-gray-500">Brainliest</p>
        <p className="text-base font-semibold text-gray-900">Student Portal</p>
      </div>
    ),
    footer: (
      <div className="text-xs text-gray-500">
        Logged in as <span className="font-medium text-gray-700">alex@brainliest.com</span>
      </div>
    ),
    items: sampleItems,
  },
};

export default meta;

type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {};
