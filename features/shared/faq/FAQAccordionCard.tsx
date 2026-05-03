'use client';

import { RiArrowDownSLine } from 'react-icons/ri';
import { cn } from '@shared/lib/utils';

interface FAQAccordionCardProps {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function FAQAccordionCard({
  id,
  question,
  answer,
  isOpen,
  onToggle,
}: FAQAccordionCardProps) {
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
      data-testid={`faq-item-${id}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        data-testid={`faq-toggle-${id}`}
      >
        <span className="font-semibold text-sm text-gray-900 dark:text-white leading-snug flex-1 min-w-0">
          {question}
        </span>
        <RiArrowDownSLine
          className={cn(
            'w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 mt-0.5',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
