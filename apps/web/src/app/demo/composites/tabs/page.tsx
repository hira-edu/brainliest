'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@brainliest/ui';

export default function TabsDemo() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Tabs</h1>
      <p className="text-gray-600">
        Tabs organize related content so learners can switch views without leaving the page.
      </p>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4 text-sm text-gray-600">
          Summary of recent sessions, streaks, and AI explanations.
        </TabsContent>
        <TabsContent value="practice" className="mt-4 text-sm text-gray-600">
          Active practice sets with remaining questions and due dates.
        </TabsContent>
        <TabsContent value="analytics" className="mt-4 text-sm text-gray-600">
          Performance charts, weak topics, and recommended next steps.
        </TabsContent>
      </Tabs>
    </div>
  );
}
