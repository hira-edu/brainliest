import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Container } from './container';

describe('Container', () => {
  it('applies default max width and padding', () => {
    const { container } = render(
      <Container data-testid="container">
        content
      </Container>
    );

    const element = container.firstElementChild as HTMLElement;
    expect(element.className).toContain('max-w-screen-xl');
    expect(element.className).toContain('px-4');
  });

  it('supports custom max width', () => {
    const { container } = render(<Container maxWidth="md" />);
    const element = container.firstElementChild as HTMLElement;

    expect(element.className).toContain('max-w-screen-md');
  });
});
