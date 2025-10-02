import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

const meta: Meta<typeof Accordion> = {
  title: 'Composites/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  args: {
    type: 'single',
    collapsible: true,
    defaultValue: 'exam-prep',
  },
};

export default meta;

type Story = StoryObj<typeof Accordion>;

export const FAQ: Story = {
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem value="exam-prep">
        <AccordionTrigger>How do AI explanations work?</AccordionTrigger>
        <AccordionContent>
          Explanations are generated contextually with structured prompts and cached for future use.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="pricing">
        <AccordionTrigger>Can I switch plans later?</AccordionTrigger>
        <AccordionContent>
          Yes, upgrades and downgrades take effect immediately and billing is prorated.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="support">
        <AccordionTrigger>Where can I get help?</AccordionTrigger>
        <AccordionContent>
          Reach out via in-app chat or email support@brainliest.com for 24/7 assistance.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
