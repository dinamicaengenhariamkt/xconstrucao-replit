'use client';

import {
  RiUserStarLine,
  RiUserAddLine,
  RiSendPlaneLine,
  RiExchangeLine,
  RiUserUnfollowLine,
} from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { StatsCard } from '@features/shared/components/StatsCard';
import type {
  StatsCardData,
  StatsCardBadgeVariant,
} from '@features/shared/components/StatsCard';
import type { AdoptionMetrics } from '../types';

function deltaVariant(delta: number): StatsCardBadgeVariant {
  if (delta > 0) return 'success';
  if (delta < 0) return 'red';
  return 'neutral';
}

function deltaLabel(delta: number, suffix = 'vs período anterior'): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}% ${suffix}`;
}

interface AdoptionMetricsSectionProps {
  metrics: AdoptionMetrics;
}

export function AdoptionMetricsSection({ metrics }: AdoptionMetricsSectionProps) {
  const cards: StatsCardData[] = [
    {
      label: 'Usuários ativos (30d)',
      value: metrics.usuariosAtivos30d,
      icon: RiUserStarLine,
      iconBgColor: 'bg-primary/10 text-primary',
      badge: {
        label: deltaLabel(metrics.usuariosAtivos30dDeltaPercent),
        variant: deltaVariant(metrics.usuariosAtivos30dDeltaPercent),
      },
      testId: 'kpi-adoption-ativos',
    },
    {
      label: 'Novos cadastros (30d)',
      value: metrics.novosUsuarios30d,
      icon: RiUserAddLine,
      iconBgColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
      testId: 'kpi-adoption-novos',
    },
    {
      label: 'Candidaturas (7d)',
      value: metrics.aplicacoes7d,
      icon: RiSendPlaneLine,
      iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
      badge: {
        label: deltaLabel(metrics.aplicacoes7dDeltaPercent, 'vs semana anterior'),
        variant: deltaVariant(metrics.aplicacoes7dDeltaPercent),
      },
      testId: 'kpi-adoption-aplicacoes',
    },
    {
      label: 'Conversão candidatura',
      value: `${metrics.taxaConversaoCandidatura}%`,
      icon: RiExchangeLine,
      iconBgColor: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
      badge: {
        label: 'p/ contrato',
        variant:
          metrics.taxaConversaoCandidatura >= 25
            ? 'success'
            : metrics.taxaConversaoCandidatura >= 15
              ? 'amber'
              : 'red',
      },
      testId: 'kpi-adoption-conversao',
    },
    {
      label: 'Churn empreiteiros',
      value: `${metrics.churnEmpreiteirosPercent}%`,
      icon: RiUserUnfollowLine,
      iconBgColor: 'bg-red-50 text-red-600 dark:bg-red-900/20',
      badge: {
        label: 'sem login 60d+',
        variant:
          metrics.churnEmpreiteirosPercent <= 5
            ? 'success'
            : metrics.churnEmpreiteirosPercent <= 10
              ? 'amber'
              : 'red',
      },
      testId: 'kpi-adoption-churn',
    },
  ];

  return (
    <Card
      className="border-border-light dark:border-gray-800"
      data-testid="adoption-metrics-section"
    >
      <CardHeader className="py-4">
        <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
          Saúde da plataforma
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Engajamento, conversão de candidaturas e retenção de empreiteiros — métricas de
          adoção, não financeiras.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map((c) => (
            <StatsCard key={c.label} {...c} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
