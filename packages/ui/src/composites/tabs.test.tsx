import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

describe('Tabs', () => {
  it('switches active tab on trigger click', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="reports">Reports content</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Overview content')).toBeVisible();
    expect(screen.queryByText('Reports content')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Reports' }));

    expect(screen.getByText('Reports content')).toBeVisible();
  });
});
