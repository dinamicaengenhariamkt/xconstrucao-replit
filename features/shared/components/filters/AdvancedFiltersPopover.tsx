'use client';

import { useState, type ReactNode } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { cn } from '@shared/lib/utils';
import { RiFilter3Line } from 'react-icons/ri';

interface AdvancedFiltersPopoverProps {
  /** Quantidade de filtros avançados ativos. Mostrado como badge ao lado do label. */
  activeCount?: number;
  /** Label do botão. Default: "Filtros avançados". */
  label?: string;
  /** Conteúdo do popover — campos de filtro (selects, toggles, etc.). */
  children: ReactNode;
  /** Callback opcional pra limpar todos os filtros avançados de uma vez. */
  onClearAll?: () => void;
  /** Largura do popover. Default: 280px (w-72). */
  contentClassName?: string;
}

/**
 * Botão "Filtros avançados (N)" que abre um popover com campos de filtro.
 * Padrão genérico — funciona com qualquer número/tipo de filtros.
 */
export function AdvancedFiltersPopover({
  activeCount = 0,
  label = 'Filtros avançados',
  children,
  onClearAll,
  contentClassName,
}: AdvancedFiltersPopoverProps) {
  const [open, setOpen] = useState(false);
  const hasActive = activeCount > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors cursor-pointer',
            hasActive
              ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
          data-testid="advanced-filters-trigger"
        >
          <RiFilter3Line className="w-4 h-4" />
          <span>{label}</span>
          {hasActive && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold tabular-nums">
              {activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn(
          'w-80 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto',
          contentClassName
        )}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{label}</h4>
          {onClearAll && hasActive && (
            <button
              type="button"
              onClick={() => {
                onClearAll();
              }}
              className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              data-testid="advanced-filters-clear-all"
            >
              Limpar todos
            </button>
          )}
        </div>
        <div className="space-y-3">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
