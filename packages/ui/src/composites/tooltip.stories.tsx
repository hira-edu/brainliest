import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip, TooltipProvider } from './tooltip';
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
    <TooltipProvider delayDuration={150}>
      <Tooltip {...args}>
        <Button variant="ghost">Hover me</Button>
      </Tooltip>
    </TooltipProvider>
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
