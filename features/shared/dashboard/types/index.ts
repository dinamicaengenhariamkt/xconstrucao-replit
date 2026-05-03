export type DashboardPeriodo = '7dias' | '30dias' | '3meses' | '12meses';

export const DASHBOARD_PERIODO_LABEL: Record<DashboardPeriodo, string> = {
  '7dias': 'Últimos 7 dias',
  '30dias': 'Últimos 30 dias',
  '3meses': 'Últimos 3 meses',
  '12meses': 'Últimos 12 meses',
};
