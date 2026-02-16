'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCompactCurrency, formatPercentage } from '../utils';
import { cn } from '@shared/lib/utils';

interface FinancialMiniCardProps {
  label: string;
  value: number;
  format: 'percentage' | 'currency' | 'number';
  color: 'success' | 'info' | 'primary';
  trend?: 'up' | 'down' | 'neutral';
  delta?: number;
}

export function FinancialMiniCard({
  label,
  value,
  format,
  color,
  trend,
  delta,
}: FinancialMiniCardProps) {
  const formattedValue =
    format === 'percentage'
      ? formatPercentage(value)
      : format === 'currency'
        ? formatCompactCurrency(value)
        : value.toString();

  const colorClasses = {
    success: 'border-success/20 bg-gradient-to-br from-success/10 to-white dark:to-gray-950',
    info: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:border-blue-900 dark:from-blue-900/20 dark:to-gray-950',
    primary: 'border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:to-gray-950',
  };

  const iconColorClasses = {
    success: 'text-success bg-success/20',
    info: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    primary: 'text-primary bg-primary/20',
  };

  return (
    <div
      className={cn(
        'p-5 rounded-xl border-l-4',
        colorClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">
            {formattedValue}
          </p>
          {trend && delta !== undefined && (
            <p
              className={cn(
                'text-xs font-semibold mt-1',
                trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-primary'
              )}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {delta > 0 ? '+' : ''}
              {delta}%
            </p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg', iconColorClasses[color])}>
          {trend === 'up' ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )}
        </div>
      </div>
    </div>
  );
}
