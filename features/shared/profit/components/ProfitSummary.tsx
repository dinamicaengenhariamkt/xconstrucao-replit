'use client';

import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { StatsCard } from '@features/admin/financeiro/components/StatsCard';
import { formatCurrencyCompact, formatCurrencyRounded } from '@shared/lib/formatters';
import { IconAttachMoney, IconTrendingUp, IconAnalytics, IconPayments } from '@shared/components/icons';
import type { ProfitSummaryData } from '../types';

interface ProfitSummaryProps {
  summary: ProfitSummaryData;
  title?: string;
  description?: string;
  className?: string;
}

export function ProfitSummary({
  summary,
  title = 'Lucro consolidado da plataforma',
  description = 'Receita, lucro e margem agregados das obras ativas.',
  className,
}: ProfitSummaryProps) {
  const { metrics, trend, totalObras } = summary;
  const marginVariant = metrics.margem >= 15 ? 'success' : metrics.margem >= 5 ? 'warning' : 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={className}
    >
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <IconPayments className="w-5 h-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <span className="text-xs text-muted-foreground">{totalObras} obras</span>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatsCard
              label="Receita total"
              value={formatCurrencyRounded(metrics.receitaTotal)}
              icon={IconAttachMoney}
              iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20"
            />
            <StatsCard
              label="Lucro estimado"
              value={formatCurrencyRounded(metrics.lucroEstimado)}
              icon={IconTrendingUp}
              iconBgColor="bg-green-50 text-green-600 dark:bg-green-900/20"
              badge={metrics.lucroEstimado < 0 ? { label: 'Prejuízo', variant: 'error' } : undefined}
            />
            <StatsCard
              label="Margem média"
              value={`${metrics.margem.toFixed(1).replace('.', ',')}%`}
              icon={IconAnalytics}
              iconBgColor="bg-purple-50 text-purple-600 dark:bg-purple-900/20"
              badge={{
                label: marginVariant === 'success' ? 'Saudável' : marginVariant === 'warning' ? 'Atenção' : 'Crítica',
                variant: marginVariant,
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tendência de lucro (6 meses)
              </p>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profit-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22846D" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22846D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mes" stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} className="text-muted-foreground" />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => [formatCurrencyCompact(value), 'Lucro']}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="lucro" stroke="#22846D" strokeWidth={2} fill="url(#profit-gradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
