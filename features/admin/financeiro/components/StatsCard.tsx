'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import type { StatsCardProps, StatsCardBadgeVariant } from '../types';

const badgeClasses: Record<StatsCardBadgeVariant, string> = {
  primary: 'text-primary bg-primary/10',
  success: 'text-[#22846D] bg-[#22846D]/10',
  warning: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  error: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  info: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  neutral: 'text-gray-400 bg-gray-50 dark:bg-gray-800',
};

export function StatsCard({ label, value, icon: Icon, iconBgColor, badge }: StatsCardProps) {
  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      whileHover={{
        scale: 1.01,
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <div className={cn('p-3 rounded-lg', iconBgColor)}>
            <Icon className="w-5 h-5" />
          </div>
          {badge && (
            <span
              className={cn(
                'text-xs font-bold px-2 py-1 rounded-full',
                badgeClasses[badge.variant] ?? badgeClasses.neutral
              )}
            >
              {badge.label}
            </span>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
