import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface FAQItem {
  question: string;
  answer: string;
}

interface DynamicFAQProps {
  questionText?: string;
  options?: string[];
  explanation?: string;
  subject?: string;
  category?: string;
  className?: string;
}

export default function DynamicFAQ({
  questionText,
  options = [],
  explanation,
  subject = '',
  category = '',
  className = ''
}: DynamicFAQProps) {
  const [faqs, setFAQs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const generateFAQs = async () => {
      if (!questionText) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/seo/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: questionText,
            options,
            explanation,
            subject,
            category
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate FAQs');
        }

        const generatedFAQs = await response.json();
        setFAQs(generatedFAQs);
      } catch (err) {
        console.error('FAQ generation error:', err);
        setError('Failed to load related questions');
      } finally {
        setIsLoading(false);
      }
    };

    generateFAQs();
  }, [questionText, options, explanation, subject, category]);

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Related Questions
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || faqs.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Related Questions
      </h3>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <Collapsible
            key={index}
            open={openItems.has(index)}
            onOpenChange={() => toggleItem(index)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full p-4 text-left justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {faq.question}
                </span>
                {openItems.has(index) ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {faq.answer}
              </p>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}