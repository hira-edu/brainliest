import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from './stack';

const meta: Meta<typeof Stack> = {
  title: 'Layout/Stack',
  component: Stack,
  tags: ['autodocs'],
  args: {
    children: [
      <div key="1" className="rounded border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-600">Item 1</div>,
      <div key="2" className="rounded border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-600">Item 2</div>,
      <div key="3" className="rounded border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-600">Item 3</div>,
    ],
  },
};

export default meta;

type Story = StoryObj<typeof Stack>;

export const Column: Story = {};

export const Row: Story = {
  args: {
    direction: 'row',
    align: 'center',
    justify: 'between',
  },
};

export const CustomGap: Story = {
  args: {
    gap: '6',
  },
};
