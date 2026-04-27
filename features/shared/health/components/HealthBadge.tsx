'use client';

import { cn } from '@shared/lib/utils';
import type { HealthStatus } from '../types';
import { HEALTH_LABELS, HEALTH_BADGE_CLASSES, HEALTH_DOT_CLASSES } from '../constants';

interface HealthBadgeProps {
  status: HealthStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function HealthBadge({ status, size = 'sm', showLabel = true, className }: HealthBadgeProps) {
  return (
    <span
      data-testid={`health-badge-${status}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        HEALTH_BADGE_CLASSES[status],
        className
      )}
    >
      <span className={cn('rounded-full', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', HEALTH_DOT_CLASSES[status])} />
      {showLabel && <span className="uppercase tracking-wider">{HEALTH_LABELS[status]}</span>}
    </span>
  );
}
