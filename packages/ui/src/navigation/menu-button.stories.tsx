import type { Meta, StoryObj } from '@storybook/react';
import { MenuButton } from './menu-button';

const meta: Meta<typeof MenuButton> = {
  title: 'Navigation/MenuButton',
  component: MenuButton,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MenuButton>;

export const Closed: Story = {
  args: {},
};

export const Open: Story = {
  args: {
    isOpen: true,
  },
};
