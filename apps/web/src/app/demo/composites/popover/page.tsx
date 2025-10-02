'use client';

import { Popover, Button } from '@brainliest/ui';

export default function PopoverDemo() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Popover</h1>
      <p className="text-gray-600">
        Popovers surface contextual actions and rich content without sending learners to a new screen.
      </p>

      <Popover
        trigger={<Button variant="outline">View assignment</Button>}
      >
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Data Structures Quiz</h2>
            <p>15 questions • 20 minutes • Mixed difficulty</p>
          </div>
          <Button size="sm">Start practice</Button>
        </div>
      </Popover>
    </div>
  );
}
