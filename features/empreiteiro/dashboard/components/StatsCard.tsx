'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import type { StatsCardProps } from '../types';

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
      <Card className="h-full transition-colors">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div className={cn('p-3 rounded-lg', iconBgColor)}>
            <Icon className="w-5 h-5" />
          </div>
          {badge && (
            <span
              className={cn(
                'text-xs font-bold px-2 py-1 rounded-full',
                badge.variant === 'success'
                  ? 'text-success bg-success/10'
                  : 'text-gray-400 bg-gray-50 dark:bg-gray-800'
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
    </motion.div>
  );
}
