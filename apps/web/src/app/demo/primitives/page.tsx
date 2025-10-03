'use client';

import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Icon,
  Input,
  Link as UiLink,
  Radio,
  Select,
  Spinner,
  Switch,
  Textarea,
} from '@brainliest/ui';
import type { SelectOption } from '@brainliest/ui';
import Link from 'next/link';
import { useState } from 'react';

const selectOptions: SelectOption[] = [
  { value: 'algebra', label: 'Algebra' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'calculus', label: 'Calculus' },
];

const PrimitiveSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="space-y-1">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <div className="flex flex-wrap items-center gap-4">{children}</div>
  </section>
);

export default function PrimitivesPage() {
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>('algebra');

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">UI primitives</p>
        <h1 className="text-3xl font-bold text-gray-900">Foundational components</h1>
        <p className="max-w-3xl text-gray-600">
          Buttons, form controls, and status indicators that ship with the design system. Each sample below uses the
          exported default styles so you can copy-paste snippets directly into application features.
        </p>
      </header>

      <div className="grid gap-6">
        <PrimitiveSection title="Buttons" description="Primary, secondary, ghost, and destructive button variants.">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="outline">Outline</Button>
        </PrimitiveSection>

        <PrimitiveSection
          title="Text Inputs"
          description="Interactive fields cover inputs, textareas, and searchable selects with status states."
        >
          <Input placeholder="Search practice sets" aria-label="Search practice sets" className="w-64" />
          <Input placeholder="Email address" type="email" state="error" className="w-64" />
          <Textarea placeholder="Leave admin notes" rows={3} className="w-72" />
          <Select
            options={selectOptions}
            value={selectedSubject}
            onValueChange={setSelectedSubject}
            placeholder="Choose subject"
            className="w-48"
          />
        </PrimitiveSection>

        <PrimitiveSection
          title="Choice Controls"
          description="Accessible checkbox, radio, and switch controls with label/description support."
        >
          <Checkbox
            defaultChecked
            label="Show flagged questions"
            description="Keep difficult items at the top of the review list."
          />
          <Radio
            name="difficulty"
            defaultChecked
            label="Medium difficulty"
            description="Recommended for daily practice."
          />
          <Switch
            defaultChecked
            label="Enable focus mode"
            description="Hide side navigation for distraction-free study sessions."
          />
        </PrimitiveSection>

        <PrimitiveSection
          title="Status & Identity"
          description="Badges, avatars, links, icons, and spinners used for status and identity."
        >
          <Badge variant="success">Published</Badge>
          <Badge variant="info" size="sm">
            24 new
          </Badge>
          <Avatar size="md" fallback="AL" />
          <UiLink href="#">View report</UiLink>
          <Link href="/practice/a-level-math" className="text-primary-600 underline">
            Practice session
          </Link>
          <Icon name="Sparkles" size="lg" aria-hidden className="text-primary-500" />
          <Spinner label="Loading results" />
        </PrimitiveSection>
      </div>
    </main>
  );
}
