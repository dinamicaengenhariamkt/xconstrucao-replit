export type AdminObraStatus = 'em_andamento' | 'concluida' | 'pausada' | 'cancelada';

export const OBRA_STATUS_LABEL: Record<AdminObraStatus, string> = {
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  pausada: 'Pausada',
  cancelada: 'Cancelada',
};

export const OBRA_STATUS_COLOR: Record<AdminObraStatus, string> = {
  em_andamento: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  concluida: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  pausada: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelada: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const OBRA_PROGRESS_COLOR: Record<AdminObraStatus, string> = {
  em_andamento: 'bg-emerald-500',
  concluida: 'bg-slate-400',
  pausada: 'bg-amber-400',
  cancelada: 'bg-red-400',
};

export interface AdminObra {
  id: string;
  nome: string;
  codigo: string;
  clienteNome: string;
  empreiteiraNome: string;
  status: AdminObraStatus;
  tipo: string;
  progresso: number;
  valorTotal: number;
  valorPago: number;
  dataInicio: string;
  dataFim?: string;
  endereco: string;
}
