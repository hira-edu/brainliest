import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './card';

describe('Card', () => {
  it('renders header, content, and footer', () => {
    render(
      <Card
        header={<span>Header</span>}
        footer={<span>Footer</span>}
      >
        Body
      </Card>
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies elevated variant', () => {
    const { container } = render(
      <Card variant="elevated" />
    );

    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('shadow-lg');
  });
});
