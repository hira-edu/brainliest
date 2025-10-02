import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './header';
import type { MenuItem } from './menu';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { Icon } from '../primitives/icon';
import { Badge } from '../primitives/badge';
import { Avatar } from '../primitives/avatar';
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTriggerButton,
} from '../composites/dropdown';

const baseLogo = (
  <div className="flex items-center gap-2 text-gray-900">
    <Icon name="GraduationCap" size="lg" className="text-primary-600" />
    <span className="text-xl font-semibold">Brainliest</span>
  </div>
);

const meta: Meta<typeof Header> = {
  title: 'Navigation/Header',
  component: Header,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Header>;

const primaryNavigation: MenuItem[] = [
  { label: 'Dashboard', href: '#dashboard', isActive: true },
  { label: 'Practice', href: '#practice' },
  { label: 'Reports', href: '#reports' },
];

const studyNavigation: MenuItem[] = [
  { label: 'Discover', href: '#discover', isActive: true },
  { label: 'Subjects', href: '#subjects' },
  { label: 'Tutors', href: '#tutors' },
  { label: 'Assignments', href: '#assignments' },
];

const creatorNavigation: MenuItem[] = [
  { label: 'Overview', href: '#overview', isActive: true },
  { label: 'My Library', href: '#library' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'Community', href: '#community' },
];

const examNavigation: MenuItem[] = [
  { label: 'Algebra II Midterm', href: '#exam', isActive: true },
  { label: 'Question 12 of 24', href: '#progress' },
];

const marketingNavigation: MenuItem[] = [
  { label: 'Features', href: '#features', isActive: true },
  { label: 'Curriculum', href: '#curriculum' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Districts', href: '#districts' },
];

export const ProductNavigation: Story = {
  name: 'Product Navigation',
  args: {
    logo: baseLogo,
    navigation: primaryNavigation,
    actions: (
      <div className="flex items-center gap-3">
        <Button variant="ghost">Support</Button>
        <Button size="sm">Sign in</Button>
      </div>
    ),
  },
};

export const StudyExperience: Story = {
  name: 'Study Experience with Search',
  args: {
    logo: baseLogo,
    navigation: studyNavigation,
    actions: (
      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block">
          <Icon
            name="Search"
            size="sm"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            size="sm"
            placeholder="Search subjects or tutors"
            className="w-64 pl-9"
            aria-label="Search study resources"
          />
        </div>
        <Button variant="ghost">Help Center</Button>
        <Button size="sm" variant="secondary">
          Upgrade
        </Button>
      </div>
    ),
  },
};

export const CreatorDashboard: Story = {
  name: 'Creator Dashboard',
  args: {
    logo: baseLogo,
    navigation: creatorNavigation,
    actions: (
      <div className="flex items-center gap-3">
        <Badge variant="info" size="sm" className="hidden lg:inline-flex">
          3 drafts
        </Badge>
        <Button variant="ghost" className="hidden lg:inline-flex">
          <Icon name="Bell" />
        </Button>
        <Button size="sm" className="hidden sm:inline-flex">
          New lesson
        </Button>
        <Dropdown
          trigger={
            <DropdownTriggerButton className="px-1">
              <span className="flex items-center gap-2">
                <Avatar size="sm" fallback="JL" />
                <Icon name="ChevronDown" size="sm" className="text-gray-400" />
              </span>
            </DropdownTriggerButton>
          }
        >
          <DropdownLabel>Signed in as</DropdownLabel>
          <DropdownItem disabled className="cursor-default text-gray-500">
            jordan@brainliest.com
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={<Icon name="User" size="sm" />}>Profile</DropdownItem>
          <DropdownItem icon={<Icon name="Settings" size="sm" />}>Settings</DropdownItem>
          <DropdownItem icon={<Icon name="LifeBuoy" size="sm" />}>Support</DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={<Icon name="LogOut" size="sm" />}>
            Sign out
          </DropdownItem>
        </Dropdown>
      </div>
    ),
  },
};

export const ExamMode: Story = {
  name: 'Exam Mode',
  args: {
    logo: (
      <div className="flex items-center gap-2 text-gray-900">
        <Icon name="BookOpen" size="lg" className="text-primary-600" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium text-gray-500">Midterm Exam</span>
          <span className="text-lg font-semibold text-gray-900">Algebra II</span>
        </div>
      </div>
    ),
    navigation: examNavigation,
    actions: (
      <div className="flex items-center gap-3">
        <Badge variant="warning" size="sm" className="font-semibold uppercase tracking-wide">
          12:24 remaining
        </Badge>
        <Button variant="ghost" className="hidden sm:inline-flex">
          Save &amp; exit
        </Button>
        <Button size="sm" variant="secondary" className="hidden sm:inline-flex">
          Flag question
        </Button>
        <Button size="sm">Submit exam</Button>
      </div>
    ),
    className: 'shadow-sm backdrop-blur-lg',
  },
};

export const MarketingLanding: Story = {
  name: 'Marketing Landing',
  args: {
    logo: baseLogo,
    navigation: marketingNavigation,
    actions: (
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="hidden sm:inline-flex">
          Contact sales
        </Button>
        <Button size="sm">Start free trial</Button>
      </div>
    ),
    className: 'border-b-0 bg-gradient-to-r from-primary-50 via-white to-primary-50',
  },
};
