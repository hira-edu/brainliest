import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs, type BreadcrumbItem } from './breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Navigation/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
};

export default meta;

const demoItems: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'Certification Prep', href: '/courses/certification' },
  { label: 'AI Fundamentals' },
];

type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  args: {
    items: demoItems,
  },
};

export const WithCustomSeparator: Story = {
  args: {
    items: demoItems,
    separator: <span className="mx-2 text-xs text-gray-300">›</span>,
  },
};
