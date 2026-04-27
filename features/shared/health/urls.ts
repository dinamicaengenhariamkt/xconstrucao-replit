import type { HealthStatus } from './types';

export const HEALTH_QUERY_PARAM = 'saude';

const VALID_STATUSES: HealthStatus[] = ['saudavel', 'atencao', 'risco'];

export function parseHealthStatus(value: string | null | undefined): HealthStatus | undefined {
  if (!value) return undefined;
  return VALID_STATUSES.includes(value as HealthStatus) ? (value as HealthStatus) : undefined;
}

export function buildObrasHealthUrl(basePath: string, status: HealthStatus): string {
  return `${basePath}?${HEALTH_QUERY_PARAM}=${status}`;
}
