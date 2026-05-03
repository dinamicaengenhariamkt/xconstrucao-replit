'use client';

import type { IconType } from 'react-icons';
import { RiArrowRightSLine } from 'react-icons/ri';
import { cn } from '@shared/lib/utils';

interface FAQCategoryCardProps {
  categoryKey: string;
  label: string;
  description?: string;
  count: number;
  iconBg?: string;
  iconColor?: string;
  Icon: IconType;
  onSelect: () => void;
  testId?: string;
}

export function FAQCategoryCard({
  categoryKey,
  label,
  description,
  count,
  iconBg,
  iconColor,
  Icon,
  onSelect,
  testId,
}: FAQCategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm hover:border-primary/30 hover:-translate-y-0.5 transition-all cursor-pointer group"
      data-testid={testId ?? `faq-category-card-${categoryKey}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
            {label}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
              {description}
            </p>
          )}
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            {count} {count === 1 ? 'pergunta' : 'perguntas'}
          </p>
        </div>
        <RiArrowRightSLine className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
      </div>
    </button>
  );
}
