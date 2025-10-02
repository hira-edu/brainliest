'use client';

import { Tooltip, Button } from '@brainliest/ui';

export default function TooltipDemo() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Tooltip</h1>
      <p className="text-gray-600">
        Tooltips surface contextual hints on hover and focus to keep advanced users productive.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <Tooltip content="Generate AI explanation" side="top">
          <Button variant="ghost">Top tooltip</Button>
        </Tooltip>
        <Tooltip content="Mark as favorite" side="right">
          <Button variant="ghost">Right tooltip</Button>
        </Tooltip>
      </div>
    </div>
  );
}
