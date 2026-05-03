'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import type { StatsCardProps } from '../types';

const badgeClasses: Record<string, string> = {
  success: 'text-success bg-success/10',
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
}: StatsCardProps) {
  const inner = (
    <Card
      className={cn(
        'h-full transition-colors',
        href && 'cursor-pointer hover:border-primary/30',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className={cn('p-3 rounded-lg', iconBgColor)}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span
            className={cn(
              'text-xs font-bold px-2 py-1 rounded-full',
              badgeClasses[badge.variant] ?? badgeClasses.neutral,
            )}
          >
            {badge.label}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <CardTitle className="text-sm font-medium text-muted-foreground mb-1">
          {label}
        </CardTitle>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{value}</p>
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      whileHover={{
        scale: 1.01,
        boxShadow:
          '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
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
