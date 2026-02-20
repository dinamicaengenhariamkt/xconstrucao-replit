'use client';

import { cn } from '@shared/lib/utils';

interface ProgressBarProps {
  value: number;
  color?: 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-red-500',
  info: 'bg-info',
  primary: 'bg-primary',
};

export function ProgressBar({ value, color = 'primary', size = 'sm', showLabel = false }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', COLOR_MAP[color])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-bold text-gray-600 dark:text-gray-400 tabular-nums">{clampedValue}%</span>}
    </div>
  );
}
