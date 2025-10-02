import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination } from './pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Composites/Pagination',
  component: Pagination,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Pagination>;

export const Playground: Story = {
  render: () => {
    const [page, setPage] = useState(3);

    return (
      <div className="space-y-4">
        <Pagination
          currentPage={page}
          totalPages={12}
          onPageChange={setPage}
        />
        <p className="text-sm text-gray-600">Current page: {page}</p>
      </div>
    );
  },
};
