'use client';

import { cn } from '@shared/lib/utils';
import type { FilterChipOption } from '../types';

interface FilterChipsProps {
  options: FilterChipOption[];
  activeValue: string;
  onSelect: (value: string) => void;
}

export function FilterChips({ options, activeValue, onSelect }: FilterChipsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((option) => {
        const isActive = option.value === activeValue;
        return (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={cn(
              'px-5 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer',
              isActive
                ? 'bg-primary text-white shadow-sm font-bold'
                : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            )}
            data-testid={`filter-chip-${option.value}`}
          >
            {option.label}{option.count !== undefined ? ` (${option.count})` : ''}
          </button>
        );
      })}
    </div>
  );
}
