import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormSection } from './form-section';

const field = <div>Field</div>;

describe('FormSection', () => {
  it('renders title and description', () => {
    render(
      <FormSection title="Profile" description="Update your details.">
        {field}
      </FormSection>
    );

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Update your details.')).toBeInTheDocument();
  });

  it('supports two column layout', () => {
    const { container } = render(
      <FormSection columns={2}>
        {field}
        {field}
      </FormSection>
    );

    const grid = container.querySelector('div.grid');
    expect(grid?.className).toContain('md:grid-cols-2');
  });
});
