'use client';

import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTriggerButton } from '@brainliest/ui';

export default function DropdownDemo() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Dropdown</h1>
      <p className="text-gray-600">
        Dropdowns expose secondary actions without overwhelming the primary interface.
      </p>

      <Dropdown
        trigger={<DropdownTriggerButton>Workspace actions</DropdownTriggerButton>}
      >
        <DropdownLabel>Workspace</DropdownLabel>
        <DropdownItem>Rename</DropdownItem>
        <DropdownItem>Invite teammates</DropdownItem>
        <DropdownSeparator />
        <DropdownItem>Settings</DropdownItem>
        <DropdownItem>Log out</DropdownItem>
      </Dropdown>
    </div>
  );
}
