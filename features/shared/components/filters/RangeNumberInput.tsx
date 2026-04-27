'use client';

import { Input } from '@shared/components/ui/input';

interface RangeNumberInputProps {
  label: string;
  min: string;
  max: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  placeholderMin?: string;
  placeholderMax?: string;
  prefix?: string;
  testIdPrefix?: string;
}

export function RangeNumberInput({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
  placeholderMin = 'Mín.',
  placeholderMax = 'Máx.',
  prefix,
  testIdPrefix,
}: RangeNumberInputProps) {
  const sanitize = (v: string) => v.replace(/[^\d]/g, '');

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          {prefix && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              {prefix}
            </span>
          )}
          <Input
            inputMode="numeric"
            placeholder={placeholderMin}
            value={min}
            onChange={(e) => onMinChange(sanitize(e.target.value))}
            className={prefix ? 'pl-8 h-9 text-sm' : 'h-9 text-sm'}
            data-testid={testIdPrefix ? `${testIdPrefix}-min` : undefined}
          />
        </div>
        <div className="relative">
          {prefix && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              {prefix}
            </span>
          )}
          <Input
            inputMode="numeric"
            placeholder={placeholderMax}
            value={max}
            onChange={(e) => onMaxChange(sanitize(e.target.value))}
            className={prefix ? 'pl-8 h-9 text-sm' : 'h-9 text-sm'}
            data-testid={testIdPrefix ? `${testIdPrefix}-max` : undefined}
          />
        </div>
      </div>
    </div>
  );
}
