'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { IconCheckCircle, IconWarning, IconErrorOutline, IconArrowForward } from '@shared/components/icons';
import type { HealthSummaryData, HealthStatus } from '../types';
import { HEALTH_LABELS, HEALTH_BADGE_CLASSES } from '../constants';

interface HealthSummaryProps {
  summary: HealthSummaryData;
  title?: string;
  className?: string;
  /**
   * Se fornecida, cada card do resumo vira um link para `hrefFor(status)`.
   * Retornar `undefined` para um status específico deixa aquele card não-clicável.
   */
  hrefFor?: (status: HealthStatus) => string | undefined;
}

const ITEMS: { key: HealthStatus; Icon: typeof IconCheckCircle }[] = [
  { key: 'saudavel', Icon: IconCheckCircle },
  { key: 'atencao', Icon: IconWarning },
  { key: 'risco', Icon: IconErrorOutline },
];

interface HealthSummaryItemProps {
  status: HealthStatus;
  Icon: typeof IconCheckCircle;
  count: number;
  pct: number;
  index: number;
  interactive: boolean;
}

function HealthSummaryItemContent({ status, Icon, count, pct, index, interactive }: HealthSummaryItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      whileHover={interactive ? { y: -2 } : undefined}
      className={cn(
        'rounded-xl border p-4 flex flex-col gap-2 h-full',
        HEALTH_BADGE_CLASSES[status],
        interactive && 'cursor-pointer transition-shadow hover:shadow-md'
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{pct}%</span>
      </div>
      <div>
        <p className="text-2xl font-extrabold tabular-nums">{count}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90">{HEALTH_LABELS[status]}</p>
      </div>
      {interactive && (
        <div className="mt-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider opacity-80">
          Ver obras <IconArrowForward className="w-3 h-3" />
        </div>
      )}
    </motion.div>
  );
}

export function HealthSummary({
  summary,
  title = 'Saúde do portfólio de obras',
  className,
  hrefFor,
}: HealthSummaryProps) {
  return (
    <Card className={className} data-testid="health-summary">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <span className="text-xs text-muted-foreground">{summary.total} obras</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {ITEMS.map(({ key, Icon }, idx) => {
            const count = summary[key];
            const pct = summary.total ? Math.round((count / summary.total) * 100) : 0;
            const href = hrefFor?.(key);
            const interactive = Boolean(href);

            const item = (
              <HealthSummaryItemContent
                status={key}
                Icon={Icon}
                count={count}
                pct={pct}
                index={idx}
                interactive={interactive}
              />
            );

            if (href) {
              return (
                <Link
                  key={key}
                  href={href}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                  data-testid={`health-summary-link-${key}`}
                >
                  {item}
                </Link>
              );
            }
            return <div key={key}>{item}</div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
