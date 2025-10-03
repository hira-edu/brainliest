import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DataTable } from './data-table';

describe('DataTable', () => {
  it('renders headers and rows', () => {
    const output = renderToString(
      <DataTable
        data={[
          { id: '1', name: 'Sample', value: 10 },
        ]}
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'value', header: 'Value', cell: (row) => row.value, align: 'right' },
        ]}
        getRowKey={(row) => row.id}
      />
    );

    expect(output).toContain('Name');
    expect(output).toContain('Sample');
    expect(output).toContain('Value');
  });

  it('renders empty state when no data', () => {
    const output = renderToString(
      <DataTable
        data={[]}
        columns={[{ id: 'name', header: 'Name', cell: (row) => row }]}
        getRowKey={(row) => String(row)}
        emptyState="No rows"
      />
    );

    expect(output).toContain('No rows');
  });
});
