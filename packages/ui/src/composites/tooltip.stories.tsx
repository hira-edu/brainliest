import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './tooltip';
import { Button } from '../primitives/button';

const meta: Meta<typeof Tooltip> = {
  title: 'Composites/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  args: {
    content: 'AI explanations available',
    side: 'top',
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="ghost">Hover me</Button>
    </Tooltip>
  ),
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Top: Story = {};

export const Right: Story = {
  args: {
    side: 'right',
  },
};
