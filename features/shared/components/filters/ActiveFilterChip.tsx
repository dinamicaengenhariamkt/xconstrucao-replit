'use client';

import { cn } from '@shared/lib/utils';
import { IconClose } from '@shared/components/icons';

interface ActiveFilterChipProps {
  label: string;
  onRemove: () => void;
  /** Classes para o container — útil pra customizar cor por tipo de filtro. */
  className?: string;
  /** Classes para o ponto colorido opcional ao lado do label. */
  dotClassName?: string;
  testId?: string;
}

/**
 * Chip removível que representa um filtro ativo na toolbar.
 * Use quando o usuário deve poder limpar um filtro individual com 1 clique.
 */
export function ActiveFilterChip({
  label,
  onRemove,
  className,
  dotClassName,
  testId,
}: ActiveFilterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border text-xs font-semibold',
        className ?? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
      )}
      data-testid={testId}
    >
      {dotClassName && <span className={cn('w-1.5 h-1.5 rounded-full', dotClassName)} />}
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
        aria-label={`Remover filtro ${label}`}
      >
        <IconClose className="w-3 h-3" />
      </button>
    </span>
  );
}
