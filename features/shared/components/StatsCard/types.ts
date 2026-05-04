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
}

export type StatsCardProps = StatsCardData;
