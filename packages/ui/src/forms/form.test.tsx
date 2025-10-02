import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Form } from './form';
import { Button } from '../primitives/button';

describe('Form', () => {
  it('renders form element', () => {
    render(
      <Form aria-label="Example form">
        <Button type="submit">Submit</Button>
      </Form>
    );

    expect(screen.getByRole('form', { name: 'Example form' })).toBeInTheDocument();
  });

  it('submits when button clicked', async () => {
    const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });
    const user = userEvent.setup();

    render(
      <Form aria-label="Example form" onSubmit={handleSubmit}>
        <Button type="submit">Submit</Button>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
