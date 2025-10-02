import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTriggerButton } from './dropdown';

const trigger = <DropdownTriggerButton>Open menu</DropdownTriggerButton>;

describe('Dropdown', () => {
  it('opens menu when trigger clicked', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown trigger={trigger}>
        <DropdownItem onClick={() => {}}>Profile</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
  });

  it('fires callback when item selected', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <Dropdown trigger={trigger}>
        <DropdownLabel>Account</DropdownLabel>
        <DropdownItem onClick={onSelect}>Settings</DropdownItem>
        <DropdownSeparator />
        <DropdownItem disabled>Disabled</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Settings' }));

    expect(onSelect).toHaveBeenCalled();
  });
});
