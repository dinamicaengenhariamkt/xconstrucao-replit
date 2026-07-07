export type {
  HealthStatus,
  HealthFactorKey,
  HealthFactors,
  HealthReason,
  ObraHealth,
  HealthSummaryData,
  HealthTrendPoint,
  HealthDrivers,
} from './types';
export { calculateHealth } from './calculate';
export { computeHealthFromObra } from './compute-from-obra';
export type { HealthObraInput } from './compute-from-obra';
export {
  HEALTH_LABELS,
  HEALTH_DESCRIPTIONS,
  HEALTH_BADGE_CLASSES,
  HEALTH_DOT_CLASSES,
  HEALTH_PROGRESS_COLOR,
  FACTOR_LABELS,
  HEALTH_THRESHOLDS,
  HEALTH_WEIGHTS,
} from './constants';
export { HEALTH_QUERY_PARAM, parseHealthStatus, buildObrasHealthUrl } from './urls';
export { useObrasHealthMap, summarizeHealthMap } from './hooks/use-obras-health';
export { useObraHealth } from './hooks/use-obra-health';
export { useSaudeFilter } from './hooks/use-saude-filter';
export type { UseSaudeFilterResult } from './hooks/use-saude-filter';
export { useSaudeMultiFilter } from './hooks/use-saude-multi-filter';
export type { UseSaudeMultiFilterResult } from './hooks/use-saude-multi-filter';
export { HealthBadge } from './components/HealthBadge';
export { HealthCard } from './components/HealthCard';
export { HealthSummary } from './components/HealthSummary';
export { HealthDetailPanel } from './components/HealthDetailPanel';
export type { HealthDetailPanelProps } from './components/HealthDetailPanel';
export { HealthFilterSelect } from './components/HealthFilterSelect';
