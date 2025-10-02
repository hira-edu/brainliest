import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from './grid';

const items = Array.from({ length: 6 }, (_, index) => (
  <div
    key={index}
    className="rounded-lg border border-dashed border-gray-200 bg-white p-4 text-center text-sm text-gray-600"
  >
    Item {index + 1}
  </div>
));

const meta: Meta<typeof Grid> = {
  title: 'Layout/Grid',
  component: Grid,
  tags: ['autodocs'],
  args: {
    children: items,
  },
};

export default meta;

type Story = StoryObj<typeof Grid>;

export const Default: Story = {};

export const FourColumns: Story = {
  args: {
    cols: '4',
  },
};

export const TightSpacing: Story = {
  args: {
    gap: '2',
  },
};
