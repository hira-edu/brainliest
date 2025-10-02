import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from './popover';
import { Button } from '../primitives/button';

const meta: Meta<typeof Popover> = {
  title: 'Composites/Popover',
  component: Popover,
  tags: ['autodocs'],
  args: {
    side: 'bottom',
    align: 'center',
    trigger: <Button variant="outline">Shows popover</Button>,
    children: (
      <div className="space-y-2 text-sm text-gray-600">
        <p>Configure advanced settings, view analytics, or access shortcuts.</p>
        <Button size="sm">Open settings</Button>
      </div>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof Popover>;

export const Playground: Story = {};
