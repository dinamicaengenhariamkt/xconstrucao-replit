'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
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
    hoverBorderClass,
    sparklineColor,
    sparklinePath,
    icon: Icon,
  } = indicador;

  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      whileHover={{
        scale: 1.01,
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn('h-full transition-all', hoverBorderClass)}>
        <CardContent className="p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className={cn('p-3 rounded-lg', iconBgClass, iconColorClass)}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={cn('text-xs font-bold px-2 py-1 rounded-full', badgeClass)}>
              {badgeLabel}
            </span>
          </div>

          {/* Values */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
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
      </Card>
    </motion.div>
  );
}
