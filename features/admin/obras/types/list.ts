export type AdminObraStatus = 'em_andamento' | 'concluida' | 'pausada' | 'planejamento';
export type AdminObraVisibilidade = 'rascunho' | 'publicada' | 'pausada' | 'arquivada';

export const OBRA_STATUS_LABEL: Record<AdminObraStatus, string> = {
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  pausada: 'Pausada',
  planejamento: 'Planejamento',
};

export const OBRA_STATUS_COLOR: Record<AdminObraStatus, string> = {
  em_andamento: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  concluida: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  pausada: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  planejamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export const OBRA_PROGRESS_COLOR: Record<AdminObraStatus, string> = {
  em_andamento: 'bg-emerald-500',
  concluida: 'bg-slate-400',
  pausada: 'bg-amber-400',
  planejamento: 'bg-blue-400',
};

export const OBRA_VISIBILIDADE_LABEL: Record<AdminObraVisibilidade, string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  pausada: 'Pausada',
  arquivada: 'Arquivada',
};

export const OBRA_VISIBILIDADE_COLOR: Record<AdminObraVisibilidade, string> = {
  rascunho: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  publicada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pausada: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  arquivada: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export interface AdminObra {
  id: string;
  nome: string;
  endereco: string;
  clienteId?: string | null;
  clienteNome?: string | null;
  empreiteiraId?: string | null;
  empreiteiraNome?: string | null;
  status: AdminObraStatus;
  visibilidade: AdminObraVisibilidade;
  tipo?: string | null;
  cidade?: string | null;
  uf?: string | null;
  progresso?: number | null;
  valorTotal?: string | null;
  valorPago?: string | null;
  dataInicio?: string | null;
  dataPrevisao?: string | null;
  createdAt?: string | null;
}

export interface AdminObrasListResponse {
  rows: AdminObra[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminObrasFilters {
  page?: number;
  pageSize?: number;
  status?: AdminObraStatus;
  visibilidade?: AdminObraVisibilidade;
  clienteId?: string;
  empreiteiraId?: string;
  periodoInicio?: string;
  periodoFim?: string;
  q?: string;
}
