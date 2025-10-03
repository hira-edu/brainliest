'use client';

/*
 * Next.js lint lacks project-aware typing for workspace imports, so we disable the unsafe operation
 * rules triggered when consuming shared types in this demo.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-redundant-type-constituents */

import { useState } from 'react';
import { CommandPalette, Button, Card, Stack, Badge } from '@brainliest/ui';
import type { CommandItem } from '@brainliest/ui';
import type { ExplanationDtoShape } from '@brainliest/shared';
import { SAMPLE_CHOICES, SAMPLE_QUESTION } from '@/lib/ai/sample-question';
import { requestExplanation } from '@/lib/ai/request-explanation';

const aiCommands: CommandItem[] = SAMPLE_CHOICES.map((choice, index) => ({
  id: `explain-${choice.value}`,
  name: `Explain ${choice.label}`,
  group: 'AI Explanation',
  shortcut: `⌘${index + 1}`,
}));

const utilityCommands: CommandItem[] = [
  { id: 'create', name: 'Create practice set', group: 'Workspace Shortcuts', shortcut: '⌘N' },
  { id: 'analytics', name: 'View analytics dashboard', group: 'Workspace Shortcuts' },
];

const commands: CommandItem[] = [...aiCommands, ...utilityCommands];

type RequestState = 'idle' | 'loading' | 'success' | 'error';

export default function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-redundant-type-constituents
  const [lastCommand, setLastCommand] = useState<CommandItem | null>(null);
  const [explanation, setExplanation] = useState<ExplanationDtoShape | null>(null);
  const [state, setState] = useState<RequestState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (command: CommandItem) => {
    setLastCommand(command);
    setOpen(false);

    if (!command.id.startsWith('explain-')) {
      return;
    }

    const choiceId = command.id.replace('explain-', '');
    setState('loading');
    setError(null);

    try {
      const result = await requestExplanation([choiceId]);
      setExplanation(result.explanation);
      setState('success');
    } catch (requestError) {
      setExplanation(null);
      setState('error');
      setError(requestError instanceof Error ? requestError.message : 'Failed to run command');
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Command Palette</h1>
      <p className="text-gray-600">
        Power users can quickly navigate and trigger actions from anywhere in the product.
      </p>

      <Button onClick={() => setOpen(true)}>Open command palette</Button>
      <p className="text-sm text-gray-500">
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
        {lastCommand ? `Executed: ${lastCommand.name}` : 'No command executed yet.'}
      </p>

      <CommandPalette
        isOpen={open}
        onClose={() => setOpen(false)}
        commands={commands}
        onSelect={(command) => {
          void handleSelect(command);
        }}
      />

      <Card padding="lg">
        <Stack gap={3}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI explanation output</h2>
            <p className="text-sm text-gray-500">
              Commands prefixed with “Explain” post to `/api/ai/explanations` using the selected answer.
            </p>
          </div>

          <p className="text-sm text-gray-600">{SAMPLE_QUESTION.stemMarkdown}</p>

          {state === 'loading' && <p className="text-sm text-slate-500">Generating explanation…</p>}
          {state === 'error' && error ? <p className="text-sm text-error-600">{error}</p> : null}

          {explanation && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-gray-900">Explanation</h3>
                <Badge variant={explanation.confidence === 'high' ? 'success' : 'default'}>
                  Confidence: {explanation.confidence}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-gray-700">{explanation.summary}</p>
              <div className="mt-3 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Steps</h4>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
                  {explanation.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </Stack>
      </Card>
    </div>
  );
}
