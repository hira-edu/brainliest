'use client';

import { useState } from 'react';
import { Button, Checkbox, Form, FormField, FormSection, Input, Select, Textarea } from '@brainliest/ui';
import type { SelectOption } from '@brainliest/ui';

const subjectOptions: SelectOption[] = [
  { value: 'algebra-ii', label: 'Algebra II' },
  { value: 'calculus-ab', label: 'Calculus AB' },
  { value: 'statistics', label: 'Statistics' },
];

export default function FormsPage() {
  const [subject, setSubject] = useState<string>('algebra-ii');
  const [withErrors, setWithErrors] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Form patterns</p>
        <h1 className="text-3xl font-bold text-gray-900">Guided form layout</h1>
        <p className="max-w-3xl text-gray-600">
          The form kit pairs semantic markup with accessible error messaging and horizontal/vertical alignment options.
          Toggle validation to preview error states and helper copy.
        </p>
      </header>

      <Form
        className="space-y-10"
        onSubmit={(event) => {
          event.preventDefault();
          setWithErrors((previous) => !previous);
        }}
      >
        <FormSection
          title="Exam details"
          description="Collect the core information needed to schedule a practice session."
          columns={2}
        >
          <FormField
            label="Exam title"
            required
            description="Displayed on the student dashboard."
            error={withErrors ? 'Exam title is required.' : undefined}
          >
            <Input placeholder="Algebra II Mock Assessment" />
          </FormField>

          <FormField label="Subject" required>
            <Select
              options={subjectOptions}
              value={subject}
              onValueChange={(value) => setSubject(value)}
              ariaLabel="Select subject"
            />
          </FormField>

          <FormField
            label="Description"
            orientation="horizontal"
            description="Optional context shown in the session sidebar."
          >
            <Textarea rows={4} placeholder="A timed drill covering differentiation and series expansions." />
          </FormField>

          <FormField
            label="Passing score"
            orientation="horizontal"
            description="Leave blank to inherit the subject default."
            error={withErrors ? 'Provide a numeric value between 0 and 100.' : undefined}
          >
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="75"
              rightAddon={<span className="text-xs">%</span>}
            />
          </FormField>
        </FormSection>

        <FormSection
          title="Publishing"
          description="Control visibility and onboarding helpers."
        >
          <FormField
            orientation="horizontal"
            label="Show onboarding tips"
            description="Surface hints for first-time students entering the exam."
          >
            <Checkbox defaultChecked />
          </FormField>

          <FormField
            orientation="horizontal"
            label="Welcome message"
            description="Appears at the top of the session before the timer starts."
            error={withErrors ? 'Compose a short welcome message.' : undefined}
          >
            <Textarea rows={3} placeholder="You have 45 minutes. Show your working and review flagged items at the end." />
          </FormField>
        </FormSection>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={withErrors}
              onChange={(event) => setWithErrors(event.target.checked)}
              label="Simulate validation errors"
            />
            <p className="text-sm text-gray-500">Toggle to preview inline error handling.</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
            <Button type="submit">Save configuration</Button>
          </div>
        </div>
      </Form>
    </main>
  );
}
