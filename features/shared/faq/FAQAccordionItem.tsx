'use client';

import { RiArrowDownSLine } from 'react-icons/ri';
import { cn } from '@shared/lib/utils';

interface FAQAccordionItemProps {
  id: string;
  question: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function FAQAccordionItem({ id, question, isOpen, onToggle, children }: FAQAccordionItemProps) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 px-1 text-left hover:text-primary transition-colors"
        data-testid={`faq-toggle-${id}`}
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-sm text-gray-900 dark:text-white pr-4">{question}</span>
        <RiArrowDownSLine
          className={cn(
            'w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-5 px-1" data-testid={`faq-item-${id}`}>
          {children}
        </div>
      )}
    </div>
  );
}
