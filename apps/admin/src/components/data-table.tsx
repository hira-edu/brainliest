import type { ReactNode } from 'react';
import { cn } from '@brainliest/ui';

export interface DataTableColumn<T> {
  readonly id: string;
  readonly header: ReactNode;
  readonly cell: (row: T) => ReactNode;
  readonly align?: 'left' | 'right';
  readonly className?: string;
}

export interface DataTableProps<T> {
  readonly columns: ReadonlyArray<DataTableColumn<T>>;
  readonly data: ReadonlyArray<T>;
  readonly getRowKey: (row: T) => string;
  readonly emptyState?: ReactNode;
  readonly dense?: boolean;
}

export function DataTable<T>({ columns, data, getRowKey, emptyState, dense = false }: DataTableProps<T>) {
  const paddingClasses = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 uppercase tracking-wide text-gray-500">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  paddingClasses,
                  column.align === 'right' ? 'text-right' : 'text-left',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={getRowKey(row)} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn(
                    'text-sm text-gray-700',
                    paddingClasses,
                    column.align === 'right' ? 'text-right' : 'text-left',
                    column.className
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}

          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                {emptyState ?? 'No records found.'}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
