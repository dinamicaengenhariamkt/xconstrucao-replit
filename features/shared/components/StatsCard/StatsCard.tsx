'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
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
}: StatsCardProps) {
  const inner = (
    <Card
      className={cn(
        'h-full transition-colors',
        luminous && 'luminous-card group overflow-hidden hover:bg-gray-50/60 dark:hover:bg-gray-800/40',
        href && (luminous ? 'cursor-pointer' : 'cursor-pointer hover:border-primary/30'),
      )}
    >
      {luminous && (
        <>
          {/* Linha primary fina no topo do card — aparece no hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[2]"
          />
          {/* Gradient bg sutil — aparece no hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
          />
        </>
      )}
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
        <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{value}</p>
      </CardContent>
    </Card>
  );

  // Sombra mais sutil quando o card tem borda luminous (não compete com a borda branca).
  const hoverBoxShadow = luminous
    ? '0 2px 8px -2px rgba(0, 0, 0, 0.06), 0 1px 3px -1px rgba(0, 0, 0, 0.03)'
    : '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';

  return (
    <motion.div
      className="rounded-xl"
      whileHover={{
        scale: 1.01,
        boxShadow: hoverBoxShadow,
      }}
      transition={{ duration: 0.2 }}
    >
      {href ? (
        <Link href={href} data-testid={testId}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </motion.div>
  );
}
