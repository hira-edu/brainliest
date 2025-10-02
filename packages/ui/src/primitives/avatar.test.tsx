import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './avatar';

describe('Avatar', () => {
  it('renders image when src provided', () => {
    render(<Avatar src="/avatar.png" alt="Profile" />);
    expect(screen.getByRole('img', { name: 'Profile' })).toBeInTheDocument();
  });

  it('renders fallback when src missing', () => {
    render(<Avatar fallback="AB" />);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });
});
