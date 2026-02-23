'use client';

import { RiCalendarLine } from 'react-icons/ri';
import { cn } from '@shared/lib/utils';
import type { PeriodoOption } from '../types';

interface PeriodoSelectorProps<T extends string> {
  options: PeriodoOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function PeriodoSelector<T extends string>({
  options,
  value,
  onChange,
}: PeriodoSelectorProps<T>) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex-wrap">
      {options.map((opt) => {
        const Icon = opt.icon ?? (opt.value === 'personalizado' ? RiCalendarLine : null);
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1 whitespace-nowrap',
              isActive
                ? 'bg-primary text-white font-bold shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
