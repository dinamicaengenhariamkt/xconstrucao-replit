import type { IconType } from 'react-icons';

export type StatsCardBadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'blue'
  | 'amber'
  | 'red';

export interface StatsCardBadge {
  label: string;
  variant: StatsCardBadgeVariant;
}

export interface StatsCardData {
  label: string;
  value: string | number;
  icon: IconType;
  iconBgColor: string;
  badge?: StatsCardBadge;
  href?: string;
  testId?: string;
  /** Aplica o efeito de borda + shimmer (light theme). Default `false`. */
  luminous?: boolean;
}

export type StatsCardProps = StatsCardData;
