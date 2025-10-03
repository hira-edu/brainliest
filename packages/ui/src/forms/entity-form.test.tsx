import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../primitives/button';
import { FormField } from './form-field';
import { FormLabel } from './form-label';
import { Input } from '../primitives/input';
import { EntityForm, EntityFormActions } from './entity-form';

describe('EntityForm', () => {
  it('renders title, description, and header actions', () => {
    render(
      <EntityForm title="Create question" description="Add a new practice question" headerActions={<Button>Help</Button>}>
        <FormField>
          <FormLabel>Title</FormLabel>
          <Input defaultValue="Example" />
        </FormField>
      </EntityForm>
    );

    expect(screen.getByRole('heading', { name: 'Create question' })).toBeInTheDocument();
    expect(screen.getByText('Add a new practice question')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
  });

  it('submits when footer button clicked', async () => {
    const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });
    const user = userEvent.setup();

    render(
      <EntityForm
        title="Example"
        onSubmit={handleSubmit}
        footer={
          <EntityFormActions>
            <Button type="submit">Save</Button>
          </EntityFormActions>
        }
      >
        <FormField>
          <FormLabel>Name</FormLabel>
          <Input defaultValue="Sample" />
        </FormField>
      </EntityForm>
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
