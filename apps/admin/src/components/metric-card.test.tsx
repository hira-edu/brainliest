import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MetricCard } from './metric-card';

describe('MetricCard', () => {
  it('renders label, value, and helper text', () => {
    const output = renderToString(
      <MetricCard label="Total" value="42" helperText="Helper" />
    );

    expect(output).toContain('Total');
    expect(output).toContain('42');
    expect(output).toContain('Helper');
  });
});
