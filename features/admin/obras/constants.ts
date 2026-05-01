import { OBRA_STATUS_LABEL, type AdminObraStatus } from './types/list';
import { HEALTH_LABELS, type HealthStatus } from '@features/shared/health';

export const ITEMS_PER_PAGE = 10;

export const STATUS_OPTIONS: { value: AdminObraStatus; label: string }[] = (
  Object.keys(OBRA_STATUS_LABEL) as AdminObraStatus[]
).map((s) => ({ value: s, label: OBRA_STATUS_LABEL[s] }));

export const SAUDE_OPTIONS: { value: HealthStatus; label: string }[] = (
  Object.keys(HEALTH_LABELS) as HealthStatus[]
).map((s) => ({ value: s, label: HEALTH_LABELS[s] }));
