/**
 * Funções utilitárias para o Dashboard do Empreiteiro
 */

import type { ActivityType } from './types';
import { FORMAT_CONFIG, ACTIVITY_COLORS } from './constants';
export { formatCurrency } from '@shared/lib/formatters';

/**
 * Formata valor monetário de forma compacta (K, M)
 */
export function formatCompactCurrency(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat(FORMAT_CONFIG.currency.locale, {
    style: 'currency',
    currency: FORMAT_CONFIG.currency.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Retorna timestamp relativo em português
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `Há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;

  return date.toLocaleDateString(FORMAT_CONFIG.date.locale, {
    day: '2-digit',
    month: 'short',
  });
}

/**
 * Retorna a data atual formatada para a welcome section
 */
export function getCurrentDateFormatted(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString(FORMAT_CONFIG.date.locale, {
    weekday: 'long',
  });
  const date = now.toLocaleDateString(FORMAT_CONFIG.date.locale, {
    day: 'numeric',
    month: 'long',
  });

  // Capitaliza a primeira letra do dia da semana
  const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return `Hoje é ${weekdayCapitalized}, ${date}. Bem-vindo de volta!`;
}

/**
 * Retorna a cor correspondente ao tipo de atividade
 */
export function getActivityColor(type: ActivityType): string {
  return ACTIVITY_COLORS[type] || 'primary';
}

/**
 * Calcula a variação percentual entre dois valores
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Formata porcentagem
 */
export function formatPercentage(value: number): string {
  return `${value}%`;
}

/**
 * Retorna a classe de cor baseada no status/trend
 */
export function getTrendColor(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return 'text-success';
    case 'down':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}
