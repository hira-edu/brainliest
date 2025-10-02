import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTriggerButton } from './dropdown';

const meta: Meta<typeof Dropdown> = {
  title: 'Composites/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Dropdown>;

export const Menu: Story = {
  render: () => (
    <Dropdown
      trigger={<DropdownTriggerButton>Workspace</DropdownTriggerButton>}
    >
      <DropdownLabel>Workspace</DropdownLabel>
      <DropdownItem>Switch workspace</DropdownItem>
      <DropdownItem>Invite teammates</DropdownItem>
      <DropdownSeparator />
      <DropdownItem>Settings</DropdownItem>
      <DropdownItem>Log out</DropdownItem>
    </Dropdown>
  ),
};

export const AlignEnd: Story = {
  render: () => (
    <Dropdown
      align="end"
      trigger={<DropdownTriggerButton>Actions</DropdownTriggerButton>}
    >
      <DropdownItem>Rename</DropdownItem>
      <DropdownItem>Duplicate</DropdownItem>
      <DropdownSeparator />
      <DropdownItem>Delete</DropdownItem>
    </Dropdown>
  ),
};
