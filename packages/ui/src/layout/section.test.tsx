import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Section } from './section';

describe('Section', () => {
  it('renders section element', () => {
    render(
      <Section aria-label="Section">
        Content
      </Section>
    );

    expect(screen.getByLabelText('Section').tagName.toLowerCase()).toBe('section');
  });

  it('applies spacing and background variants', () => {
    const { getByLabelText } = render(
      <Section aria-label="Section" spacing="lg" background="gray" />
    );

    const section = getByLabelText('Section');
    expect(section.className).toContain('py-16');
    expect(section.className).toContain('bg-gray-50');
  });
});
