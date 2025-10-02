import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './icon';
import { Button } from './button';

type Story = StoryObj<typeof Button>;

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Primary Button',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;

export const Primary: Story = {};

export const WithIcons: Story = {
  args: {
    leftIcon: <Icon name="ArrowLeft" aria-hidden />,
    rightIcon: <Icon name="ArrowRight" aria-hidden />,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
  },
};

export const Variants: Story = {
  render: (props) => (
    <div className="flex flex-wrap gap-4">
      <Button {...props} variant="primary">
        Primary
      </Button>
      <Button {...props} variant="secondary">
        Secondary
      </Button>
      <Button {...props} variant="outline">
        Outline
      </Button>
      <Button {...props} variant="ghost">
        Ghost
      </Button>
      <Button {...props} variant="danger">
        Danger
      </Button>
      <Button {...props} variant="success">
        Success
      </Button>
    </div>
  ),
};
