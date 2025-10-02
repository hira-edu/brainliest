import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './pagination';
import { useState } from 'react';

function PaginationHarness() {
  const [page, setPage] = useState(1);

  return (
    <>
      <Pagination currentPage={page} totalPages={5} onPageChange={setPage} />
      <span data-testid="current-page">{page}</span>
    </>
  );
}

describe('Pagination', () => {
  it('renders page buttons with ellipsis', () => {
    const onChange = vi.fn();

    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={onChange}
      />
    );

    expect(screen.getByRole('button', { name: 'Page 5' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByText('…')).toHaveLength(2);
  });

  it('triggers onPageChange when next clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onChange} />
    );

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('updates controlled page value when parent state changes', async () => {
    const user = userEvent.setup();

    render(<PaginationHarness />);

    expect(screen.getByTestId('current-page')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByTestId('current-page')).toHaveTextContent('2');

    await user.click(screen.getByRole('button', { name: 'Previous page' }));

    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
  });

  it('keeps the middle window stable within a chunk of pages', () => {
    const onChange = vi.fn();
    const getPages = () =>
      screen
        .getAllByRole('button', { name: /Page/ })
        .map((button) => Number(button.textContent));

    const { rerender } = render(
      <Pagination currentPage={7} totalPages={18} onPageChange={onChange} />
    );

    expect(getPages()).toEqual([1, 7, 8, 9, 18]);

    rerender(<Pagination currentPage={8} totalPages={18} onPageChange={onChange} />);
    expect(getPages()).toEqual([1, 7, 8, 9, 18]);

    rerender(<Pagination currentPage={9} totalPages={18} onPageChange={onChange} />);
    expect(getPages()).toEqual([1, 7, 8, 9, 18]);

    rerender(<Pagination currentPage={10} totalPages={18} onPageChange={onChange} />);
    expect(getPages()).toEqual([1, 10, 11, 12, 18]);
  });
});
