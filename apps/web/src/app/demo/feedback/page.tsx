'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  EmptyState,
  Progress,
  Skeleton,
  Stack,
  Toast,
  ToastAction,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@brainliest/ui';

export default function FeedbackPage() {
  const [toastOpen, setToastOpen] = useState(false);

  return (
    <ToastProvider swipeDirection="right">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Feedback</p>
          <h1 className="text-3xl font-bold text-gray-900">Status & system feedback</h1>
          <p className="max-w-3xl text-gray-600">
            Alerts, progress indicators, skeleton placeholders, and toast notifications communicate real-time system
            feedback to learners and admins.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
              <p className="text-sm text-gray-600">Use contextual variants for system-wide banners.</p>
            </div>
            <Stack gap={3}>
              <Alert title="Exam scheduled" description="Your Algebra II mock exam is now visible to students." />
              <Alert
                variant="warning"
                title="Timer paused"
                description="We detected connectivity issues. Progress will resume once the session reconnects."
              />
              <Alert
                variant="error"
                title="Submission failed"
                description="Retry saving the explanation or contact support if the issue persists."
              />
            </Stack>
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">Progress & skeleton</h2>
              <p className="text-sm text-gray-600">Show loading states while data hydrates.</p>
            </div>
            <Stack gap={4}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
                  <span>Practice completion</span>
                  <span>58%</span>
                </div>
                <Progress value={58} max={100} />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </Stack>
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">Empty states</h2>
              <p className="text-sm text-gray-600">Guide users when no results or data are available.</p>
            </div>
            <EmptyState
              title="No bookmarks yet"
              description="Save challenging problems to revisit them during review sessions."
              action={<Button>Browse recommended questions</Button>}
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-900">Toast notifications</h2>
                <p className="text-sm text-gray-600">Trigger lightweight confirmations without leaving the page.</p>
              </div>
              <Button onClick={() => setToastOpen(true)}>Trigger toast</Button>
            </div>
          </section>
        </div>

        <Toast
          open={toastOpen}
          onOpenChange={setToastOpen}
          variant="success"
          duration={4000}
        >
          <div className="space-y-2 pr-6">
            <ToastTitle>Explanation saved</ToastTitle>
            <ToastDescription>
              Students will now see the updated solution when reviewing flagged questions.
            </ToastDescription>
          </div>
          <div className="mt-3 flex gap-2">
            <ToastAction altText="View explanation">View</ToastAction>
            <Button variant="ghost" size="sm" onClick={() => setToastOpen(false)}>
              Dismiss
            </Button>
          </div>
        </Toast>
        <ToastViewport />
      </main>
    </ToastProvider>
  );
}
