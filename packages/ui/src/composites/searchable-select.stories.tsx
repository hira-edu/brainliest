import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SearchableSelect } from './searchable-select';

const options = [
  { value: 'ai', label: 'AI Fundamentals', description: 'Core ML concepts' },
  { value: 'security', label: 'Security Analyst', description: 'Incident response, SOC workflows' },
  { value: 'cloud', label: 'Cloud Architect', description: 'Multi-cloud design patterns' },
];

const SearchableSelectPlayground = () => {
  const [value, setValue] = useState<string | undefined>();

  return (
    <div className="space-y-3">
      <SearchableSelect options={options} value={value} onChange={setValue} />
      <p className="text-sm text-gray-600">Selected: {value ?? 'None'}</p>
    </div>
  );
};

const meta: Meta<typeof SearchableSelect> = {
  title: 'Composites/SearchableSelect',
  component: SearchableSelect,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SearchableSelect>;

export const Playground: Story = {
  render: () => <SearchableSelectPlayground />,
};
