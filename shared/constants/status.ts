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

/**
 * Classes do badge por status do banco. Só o xgestão usa (obra própria).
 *
 * PRD 55 — um tom mais escuro da mesma cor para o branco passar no contraste
 * AA (4,5): blue-500/90 dava 4,3, amber-500/90 2,1 e green-600/90 3,3. No
 * escuro, a mesma cor em fundo translúcido.
 */
export const OBRA_STATUS_DB_BADGE_CLASSES: Record<ObraStatusDb, string> = {
  planejamento: 'bg-blue-600 text-white dark:bg-blue-900/50 dark:text-blue-200',
  em_andamento: 'bg-primary/90 text-white dark:bg-white/15 dark:text-foreground',
  pausada:      'bg-amber-700 text-white dark:bg-amber-900/50 dark:text-amber-200',
  concluida:    'bg-green-700 text-white dark:bg-green-900/50 dark:text-green-200',
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
  em_execucao:    'bg-primary/90 text-white dark:bg-white/15 dark:text-foreground',
  com_atrasos:    'bg-red-500/90 text-white dark:bg-red-900/50 dark:text-red-200',
  com_pendencias: 'bg-amber-500/90 text-white dark:bg-amber-900/50 dark:text-amber-200',
  planejamento:   'bg-blue-500/90 text-white dark:bg-blue-900/50 dark:text-blue-200',
  finalizada:     'bg-green-600/90 text-white dark:bg-green-900/50 dark:text-green-200',
};

/**
 * PRD 55 — os mesmos selos do card da obra, com o tom que passa no contraste
 * AA. Só o xgestão usa; o marketplace segue com `STATUS_BADGE_CLASSES`.
 */
export const STATUS_BADGE_CLASSES_XGESTAO: Record<string, string> = {
  ...STATUS_BADGE_CLASSES,
  com_atrasos:    'bg-red-600 text-white dark:bg-red-900/50 dark:text-red-200',
  com_pendencias: 'bg-amber-700 text-white dark:bg-amber-900/50 dark:text-amber-200',
  planejamento:   'bg-blue-600 text-white dark:bg-blue-900/50 dark:text-blue-200',
  finalizada:     'bg-green-700 text-white dark:bg-green-900/50 dark:text-green-200',
};

/**
 * PRD 55 — iniciais brancas dos membros da equipe no xgestão: um tom mais
 * escuro da cor sorteada (`build-detalhe-server.ts`), para passar no AA.
 * Cor fora da lista volta como veio.
 */
const COR_MEMBRO_LEGIVEL: Record<string, string> = {
  'bg-blue-500': 'bg-blue-600',
  'bg-emerald-500': 'bg-emerald-700',
  'bg-amber-500': 'bg-amber-700',
  'bg-purple-500': 'bg-purple-600',
  'bg-rose-500': 'bg-rose-600',
  'bg-cyan-500': 'bg-cyan-700',
};

export function corMembroLegivel(cor: string): string {
  return COR_MEMBRO_LEGIVEL[cor] ?? cor;
}
