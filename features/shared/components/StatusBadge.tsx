'use client';

import { cn } from '@shared/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'cyan';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  size?: 'sm' | 'md';
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-info/10 text-info',
  neutral: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  primary: 'bg-primary/10 text-primary',
  cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

export function StatusBadge({ label, variant, size = 'sm' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded-full uppercase tracking-wider',
        VARIANT_STYLES[variant],
        size === 'sm' ? 'text-[10px] px-2.5 py-1' : 'text-xs px-3 py-1.5'
      )}
    >
      {label}
    </span>
  );
}
