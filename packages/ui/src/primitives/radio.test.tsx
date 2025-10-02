import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Radio } from './radio';

describe('Radio', () => {
  it('renders label and description', () => {
    render(<Radio label="Option" description="Description" name="choices" />);

    expect(screen.getByText('Option')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('selects when clicked', async () => {
    const user = userEvent.setup();
    render(<Radio label="Option" name="group" />);

    const radio = screen.getByRole('radio');
    expect(radio).not.toBeChecked();

    await user.click(radio);
    expect(radio).toBeChecked();
  });
});
