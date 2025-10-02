import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Composites/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  args: {
    defaultValue: 'overview',
  },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const Basic: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="practice">Practice</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-gray-600">
          High-level summary of the learner’s performance.
        </p>
      </TabsContent>
      <TabsContent value="practice">
        <p className="text-sm text-gray-600">
          Track active practice sets and in-progress exams.
        </p>
      </TabsContent>
      <TabsContent value="analytics">
        <p className="text-sm text-gray-600">
          Deep dive into question difficulty, subject mastery, and trends.
        </p>
      </TabsContent>
    </Tabs>
  ),
};
