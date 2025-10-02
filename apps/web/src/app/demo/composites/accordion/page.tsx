'use client';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@brainliest/ui';

export default function AccordionDemo() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Accordion</h1>
      <p className="text-gray-600">
        Accordions reveal supporting information without overwhelming the learner.
      </p>

      <Accordion type="single" collapsible defaultValue="faq-1">
        <AccordionItem value="faq-1">
          <AccordionTrigger>How are exam questions sourced?</AccordionTrigger>
          <AccordionContent>
            We curate official practice items, retired exam questions, and AI-generated variations to keep content fresh.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-2">
          <AccordionTrigger>Can I reset my progress?</AccordionTrigger>
          <AccordionContent>
            Yes. Reset attempts per session or clear your entire history from Settings → Practice Sessions.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-3">
          <AccordionTrigger>Do AI explanations cost extra?</AccordionTrigger>
          <AccordionContent>
            Explanations are included in all paid plans. Usage is throttled to maintain quality and keep costs predictable.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
