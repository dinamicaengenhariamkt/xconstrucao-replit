'use client';

import { cn } from '@shared/lib/utils';
import { RiStarFill, RiStarLine } from 'react-icons/ri';

interface StarRatingFilterProps {
  label: string;
  /** Estrelas selecionadas (0..5) ou undefined se nenhum filtro. 0 = "Sem avaliação". */
  value: number | undefined;
  onChange: (next: number | undefined) => void;
  testIdPrefix?: string;
}

/**
 * Seletor de qualidade: 5 estrelas (1..5) + pílula "Sem avaliação" (0).
 * A semântica (exato vs. mínimo) é definida pelo consumidor na lógica de filtragem.
 * Clicar de novo na mesma opção limpa o filtro.
 */
export function StarRatingFilter({ label, value, onChange, testIdPrefix }: StarRatingFilterProps) {
  const semAvaliacaoActive = value === 0;
  const hint =
    value === undefined
      ? null
      : value === 0
      ? 'Sem avaliação'
      : `${value} ${value === 1 ? 'estrela' : 'estrelas'}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        {value !== undefined && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[10px] text-primary font-semibold hover:underline cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value !== undefined && value > 0 && n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(value === n ? undefined : n)}
              data-testid={testIdPrefix ? `${testIdPrefix}-${n}` : undefined}
              aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
              className={cn(
                'p-1 rounded-md transition-colors cursor-pointer',
                'hover:bg-amber-50 dark:hover:bg-amber-900/20'
              )}
            >
              {active ? (
                <RiStarFill className="w-5 h-5 text-amber-400" />
              ) : (
                <RiStarLine className="w-5 h-5 text-gray-300 dark:text-gray-600" />
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(semAvaliacaoActive ? undefined : 0)}
          data-testid={testIdPrefix ? `${testIdPrefix}-0` : undefined}
          aria-label="Sem avaliação"
          aria-pressed={semAvaliacaoActive}
          className={cn(
            'ml-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer',
            semAvaliacaoActive
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
        >
          Sem avaliação
        </button>
        {hint && (
          <span className="ml-2 text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
    </div>
  );
}
