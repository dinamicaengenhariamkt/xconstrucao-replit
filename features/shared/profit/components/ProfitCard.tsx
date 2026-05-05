'use client';

import { motion } from 'framer-motion';
import { StatsCard } from '@features/admin/financeiro/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { formatCurrencyRounded } from '@shared/lib/formatters';
import {
  IconAttachMoney,
  IconReceiptLong,
  IconTrendingUp,
  IconAnalytics,
  IconPayments,
} from '@shared/components/icons';
import type { ProfitMetrics, MarginVariant } from '../types';

interface ProfitCardProps {
  metrics: ProfitMetrics;
  title?: string;
  description?: string;
  luminous?: boolean;
}

function marginVariant(margem: number): MarginVariant {
  if (margem >= 15) return 'success';
  if (margem >= 5) return 'warning';
  return 'error';
}

const VARIANT_BADGE_LABEL: Record<MarginVariant, string> = {
  success: 'Saudável',
  warning: 'Atenção',
  error: 'Crítica',
};

export function ProfitCard({
  metrics,
  title = 'Visão de Lucro',
  description = 'Estimativa baseada no orçamento, entradas e saídas registradas.',
  luminous = false,
}: ProfitCardProps) {
  const variant = marginVariant(metrics.margem);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className={cn(luminous && 'luminous-section border-transparent shadow-none')}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IconPayments className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label="Receita total"
              value={formatCurrencyRounded(metrics.receitaTotal)}
              icon={IconAttachMoney}
              iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20"
              luminous={luminous}
              compact
            />
            <StatsCard
              label="Custo total"
              value={formatCurrencyRounded(metrics.custoTotal)}
              icon={IconReceiptLong}
              iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20"
              luminous={luminous}
              compact
            />
            <StatsCard
              label="Lucro estimado"
              value={formatCurrencyRounded(metrics.lucroEstimado)}
              icon={IconTrendingUp}
              iconBgColor="bg-green-50 text-green-600 dark:bg-green-900/20"
              badge={metrics.lucroEstimado < 0 ? { label: 'Prejuízo', variant: 'error' } : undefined}
              luminous={luminous}
              compact
            />
            <StatsCard
              label="Margem"
              value={`${metrics.margem.toFixed(1).replace('.', ',')}%`}
              icon={IconAnalytics}
              iconBgColor="bg-purple-50 text-purple-600 dark:bg-purple-900/20"
              badge={{ label: VARIANT_BADGE_LABEL[variant], variant }}
              luminous={luminous}
              compact
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
