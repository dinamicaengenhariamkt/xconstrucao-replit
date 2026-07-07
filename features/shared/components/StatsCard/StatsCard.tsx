'use client';

import { CardContent, CardHeader } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { LuminousHoverCard } from '@shared/components/ui/LuminousHoverCard';
import type { StatsCardBadgeVariant, StatsCardProps } from './types';

const BADGE_CLASSES: Record<StatsCardBadgeVariant, string> = {
  primary: 'text-primary bg-primary/10',
  success: 'text-[#22846D] bg-[#22846D]/10',
  warning: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  error: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  info: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  neutral: 'text-gray-400 bg-gray-50 dark:bg-gray-800',
  blue: 'text-blue-600 bg-blue-50',
  amber: 'text-amber-600 bg-amber-50',
  red: 'text-red-600 bg-red-50',
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconBgColor,
  badge,
  href,
  testId,
  luminous = false,
  compact = false,
}: StatsCardProps) {
  return (
    <LuminousHoverCard
      href={href}
      testId={testId}
      luminous={luminous}
      cardClassName={cn(
        href && (luminous ? 'cursor-pointer' : 'cursor-pointer hover:border-primary/30'),
      )}
    >
      <CardHeader className="relative z-10 flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div
          className={cn(
            'p-3 rounded-lg transition-all duration-300',
            iconBgColor,
            luminous && 'border border-transparent group-hover:border-primary/40 group-hover:scale-105',
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span
            className={cn(
              'text-xs font-bold px-2 py-1 rounded-full',
              BADGE_CLASSES[badge.variant] ?? BADGE_CLASSES.neutral,
            )}
          >
            {badge.label}
          </span>
        )}
      </CardHeader>
      <CardContent className="relative z-10">
        <p
          className={cn(
            'text-sm font-medium text-muted-foreground mb-1 transition-colors duration-300',
            luminous && 'group-hover:text-primary',
          )}
        >
          {label}
        </p>
        <p className={cn('font-extrabold text-gray-900 dark:text-gray-100', compact ? 'text-2xl' : 'text-3xl')}>{value}</p>
      </CardContent>
    </LuminousHoverCard>
  );
}
