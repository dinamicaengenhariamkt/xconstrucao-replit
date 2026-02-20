'use client';

import { cn } from '@shared/lib/utils';
import type { FAQAccordionItemProps } from '../types';

export function FAQAccordionItem({ item, isOpen, onToggle }: FAQAccordionItemProps) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 px-1 text-left hover:text-primary transition-colors"
        data-testid={`faq-item-${item.id}`}
      >
        <span className="font-semibold text-sm text-gray-900 dark:text-white pr-4">{item.question}</span>
        <span className={cn("material-symbols-outlined text-gray-400 transition-transform duration-200 flex-shrink-0", isOpen && "rotate-180")}>
          expand_more
        </span>
      </button>
      {isOpen && (
        <div className="pb-5 px-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}
