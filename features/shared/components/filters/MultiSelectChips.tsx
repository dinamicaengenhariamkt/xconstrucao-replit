'use client';

import { cn } from '@shared/lib/utils';

export interface MultiSelectChipsOption<T extends string | number> {
  value: T;
  label: string;
  className?: string;
  activeClassName?: string;
}

interface MultiSelectChipsProps<T extends string | number> {
  options: MultiSelectChipsOption<T>[];
  values: T[];
  onChange: (next: T[]) => void;
  label?: string;
  testIdPrefix?: string;
}

export function MultiSelectChips<T extends string | number>({
  options,
  values,
  onChange,
  label,
  testIdPrefix,
}: MultiSelectChipsProps<T>) {
  const toggle = (v: T) => {
    if (values.includes(v)) {
      onChange(values.filter((x) => x !== v));
    } else {
      onChange([...values, v]);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = values.includes(opt.value);
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => toggle(opt.value)}
              data-testid={testIdPrefix ? `${testIdPrefix}-${opt.value}` : undefined}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer',
                active
                  ? opt.activeClassName ?? 'bg-primary text-white border-primary'
                  : opt.className ?? 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
