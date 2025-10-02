import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

describe('Accordion', () => {
  it('expands and collapses items', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Overview</AccordionTrigger>
          <AccordionContent>Overview content</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Details</AccordionTrigger>
          <AccordionContent>Details content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(screen.getByText('Overview content')).toBeVisible();
    expect(screen.queryByText('Details content')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByText('Details content')).toBeVisible();
  });
});
