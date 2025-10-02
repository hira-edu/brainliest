import type { Meta, StoryObj } from '@storybook/react';
import { FormError } from './form-error';
import { Icon } from '../primitives/icon';

const meta: Meta<typeof FormError> = {
  title: 'Forms/FormError',
  component: FormError,
  tags: ['autodocs'],
  args: {
    children: 'This field is required.',
  },
};

export default meta;

type Story = StoryObj<typeof FormError>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: {
    icon: <Icon name="CircleAlert" aria-hidden />,
  },
};
