'use client';

import { Input } from '@shared/components/ui/input';

interface RangeDateInputProps {
  label: string;
  /** Valor min em formato ISO `YYYY-MM-DD` (formato nativo do input type=date). */
  min: string;
  /** Valor max em formato ISO `YYYY-MM-DD`. */
  max: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  testIdPrefix?: string;
}

/**
 * Par de inputs date min/max. Usa o formato ISO nativo do input type="date".
 * Para comparar com datas em outros formatos (ex.: pt-BR `DD/MM/YYYY`),
 * converta na lógica de filtragem do consumidor.
 */
export function RangeDateInput({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
  testIdPrefix,
}: RangeDateInputProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={min}
          onChange={(e) => onMinChange(e.target.value)}
          className="h-9 text-sm"
          aria-label={`${label} — de`}
          data-testid={testIdPrefix ? `${testIdPrefix}-min` : undefined}
        />
        <Input
          type="date"
          value={max}
          onChange={(e) => onMaxChange(e.target.value)}
          className="h-9 text-sm"
          aria-label={`${label} — até`}
          data-testid={testIdPrefix ? `${testIdPrefix}-max` : undefined}
        />
      </div>
    </div>
  );
}
