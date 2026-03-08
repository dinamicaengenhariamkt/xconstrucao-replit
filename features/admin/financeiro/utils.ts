import { formatCurrency as _formatCurrency } from '@shared/lib/formatters';
export { formatCurrency } from '@shared/lib/formatters';

export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}K`;
  }
  return _formatCurrency(value);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}
