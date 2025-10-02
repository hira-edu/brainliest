'use client';

import { useState } from 'react';
import { SearchableSelect } from '@brainliest/ui';

const options = [
  { value: 'ai', label: 'AI Fundamentals', description: 'Core ML and prompt engineering' },
  { value: 'pmp', label: 'Project Management Professional', description: 'Official PMI objectives' },
  { value: 'security+', label: 'Security+', description: 'Threat detection and incident response' },
];

export default function SearchableSelectDemo() {
  const [value, setValue] = useState<string | undefined>();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Searchable Select</h1>
      <p className="text-gray-600">
        Combobox component for quickly filtering long lists of certifications or subjects.
      </p>

      <SearchableSelect options={options} value={value} onChange={setValue} />
      <p className="text-sm text-gray-500">Selected: {value ?? 'None'}</p>
    </div>
  );
}
