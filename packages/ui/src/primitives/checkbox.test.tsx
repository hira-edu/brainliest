import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders with label and description', () => {
    render(
      <Checkbox label="Accept terms" description="You must agree before continuing" />
    );

    expect(screen.getByText('Accept terms')).toBeInTheDocument();
    expect(screen.getByText('You must agree before continuing')).toBeInTheDocument();
  });

  it('toggles value on click', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Accept" />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('toggles value via keyboard', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Accept" />);

    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();

    await user.keyboard('{Space}');
    expect(checkbox).toBeChecked();
  });
});
