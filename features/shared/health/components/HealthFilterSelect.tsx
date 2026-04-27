'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { cn } from '@shared/lib/utils';
import type { HealthStatus, HealthSummaryData } from '../types';
import { HEALTH_LABELS, HEALTH_DOT_CLASSES } from '../constants';
import { parseHealthStatus } from '../urls';

interface HealthFilterSelectProps {
  value: HealthStatus | undefined;
  onChange: (next: HealthStatus | undefined) => void;
  /** Counts opcionais por status — exibidos como `(N)` ao lado do label. */
  summary?: HealthSummaryData;
  label?: string;
  className?: string;
}

const ALL_VALUE = '__all__';

const STATUSES: HealthStatus[] = ['saudavel', 'atencao', 'risco'];

export function HealthFilterSelect({
  value,
  onChange,
  summary,
  label = 'Saúde',
  className,
}: HealthFilterSelectProps) {
  function handleChange(next: string) {
    if (next === ALL_VALUE) {
      onChange(undefined);
    } else {
      onChange(parseHealthStatus(next));
    }
  }

  const renderOption = (status: HealthStatus) => (
    <SelectItem key={status} value={status}>
      <span className="inline-flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full', HEALTH_DOT_CLASSES[status])} />
        {HEALTH_LABELS[status]}
        {summary && <span className="text-muted-foreground">({summary[status]})</span>}
      </span>
    </SelectItem>
  );

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <Select value={value ?? ALL_VALUE} onValueChange={handleChange}>
        <SelectTrigger data-testid="health-filter-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>
            <span className="inline-flex items-center gap-2">
              Todas {summary && <span className="text-muted-foreground">({summary.total})</span>}
            </span>
          </SelectItem>
          {STATUSES.map(renderOption)}
        </SelectContent>
      </Select>
    </div>
  );
}
