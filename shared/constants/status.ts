export const STATUS_LABELS: Record<string, string> = {
  em_execucao: 'Em execução',
  com_atrasos: 'Com atraso',
  com_pendencias: 'Com pendências',
  planejamento: 'Planejamento',
  finalizada: 'Finalizada',
};

/**
 * Rótulos do enum `obra_status` do banco (`shared/db/schema.ts`).
 *
 * Vocabulário distinto do `STATUS_LABELS` acima, que nomeia o status *derivado*
 * da UI do marketplace (`em_execucao`, `com_atrasos`…). Aplicar um dicionário
 * sobre o vocabulário do outro faz o valor cru vazar para a tela — foi o que
 * acontecia no link público, que exibia `em_andamento` com underscore.
 */
export const OBRA_STATUS_DB_LABELS: Record<ObraStatusDb, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em andamento',
  pausada: 'Pausada',
  concluida: 'Concluída',
};

export type ObraStatusDb = 'planejamento' | 'em_andamento' | 'pausada' | 'concluida';

/** Classes do badge por status do banco, no mesmo tom do `STATUS_BADGE_CLASSES`. */
export const OBRA_STATUS_DB_BADGE_CLASSES: Record<ObraStatusDb, string> = {
  planejamento: 'bg-blue-500/90 text-white',
  em_andamento: 'bg-primary/90 text-white',
  pausada:      'bg-amber-500/90 text-white',
  concluida:    'bg-green-600/90 text-white',
};

/** Rótulo seguro: cobre valores fora do enum sem exibir o texto cru. */
export function obraStatusDbLabel(status: string): string {
  return OBRA_STATUS_DB_LABELS[status as ObraStatusDb] ?? 'Em andamento';
}

export const STATUS_BORDER_COLORS: Record<string, string> = {
  em_execucao: 'border-l-primary',
  com_atrasos: 'border-l-red-500',
  com_pendencias: 'border-l-amber-500',
  planejamento: 'border-l-info',
  finalizada: 'border-l-success',
};

export const STATUS_BADGE_VARIANTS: Record<string, string> = {
  em_execucao: 'primary',
  com_atrasos: 'error',
  com_pendencias: 'warning',
  planejamento: 'info',
  finalizada: 'success',
};

export const PROGRESS_COLORS: Record<string, string> = {
  em_execucao: 'primary',
  com_atrasos: 'error',
  com_pendencias: 'warning',
  planejamento: 'info',
  finalizada: 'success',
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  em_execucao:    'bg-primary/90 text-white',
  com_atrasos:    'bg-red-500/90 text-white',
  com_pendencias: 'bg-amber-500/90 text-white',
  planejamento:   'bg-blue-500/90 text-white',
  finalizada:     'bg-green-600/90 text-white',
};
