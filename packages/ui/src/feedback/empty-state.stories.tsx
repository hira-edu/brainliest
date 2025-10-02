import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './empty-state';
import { Button } from '../primitives/button';
import { Icon } from '../primitives/icon';

type Story = StoryObj<typeof EmptyState>;

const meta: Meta<typeof EmptyState> = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  args: {
    title: 'No exam sessions yet',
    description: 'Launch a new practice session to start tracking your progress.',
  },
};

export default meta;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: <Button>Start session</Button>,
  },
};

export const WithIcon: Story = {
  args: {
    icon: <Icon name="ListChecks" aria-hidden />,
  },
};
