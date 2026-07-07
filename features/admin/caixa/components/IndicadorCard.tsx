'use client';

import { CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { LuminousHoverCard } from '@shared/components/ui/LuminousHoverCard';
import type { IndiceEconomico } from '../types';

interface IndicadorCardProps {
  indicador: IndiceEconomico;
}

export function IndicadorCard({ indicador }: IndicadorCardProps) {
  const {
    label,
    value,
    subtitle,
    badgeLabel,
    badgeClass,
    iconBgClass,
    iconColorClass,
    sparklineColor,
    sparklinePath,
    icon: Icon,
  } = indicador;

  return (
    <LuminousHoverCard>
      <CardContent className="relative z-10 p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div
            className={cn(
              'p-3 rounded-lg border border-transparent transition-all duration-300 group-hover:border-primary/40 group-hover:scale-105',
              iconBgClass,
              iconColorClass,
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <span className={cn('text-xs font-bold px-2 py-1 rounded-full', badgeClass)}>
            {badgeLabel}
          </span>
        </div>

        {/* Values */}
        <div>
          <p className="text-sm font-medium text-muted-foreground transition-colors duration-300 group-hover:text-primary">
            {label}
          </p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Sparkline */}
        <div className="h-8 w-full">
          <svg
            className="w-full h-full"
            viewBox="0 0 120 32"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={sparklinePath}
              fill="none"
              stroke={sparklineColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </CardContent>
    </LuminousHoverCard>
  );
}
