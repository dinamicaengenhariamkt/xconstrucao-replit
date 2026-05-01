import type {
  EntradaTipoReceita,
  EntradaOrigem,
  EntradaStatus,
  EntradaPeriodo,
} from './types';

export const tipoReceitaLabels: Record<EntradaTipoReceita, string> = {
  taxa_medicao: 'Taxa sobre medição',
  assinatura: 'Assinatura',
  outros_servicos: 'Outros serviços',
};

export const tipoReceitaClasses: Record<EntradaTipoReceita, string> = {
  taxa_medicao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  assinatura: 'bg-[#22846D]/10 text-[#22846D]',
  outros_servicos: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export const origemLabels: Record<EntradaOrigem, string> = {
  cliente: 'Cliente',
  empreiteira: 'Empreiteira',
  outros: 'Outros',
};

export const statusLabels: Record<EntradaStatus, string> = {
  recebido: 'Recebido',
  pendente: 'Pendente',
  em_processamento: 'Em processamento',
};

export const statusClasses: Record<EntradaStatus, string> = {
  recebido: 'bg-[#22846D]/10 text-[#22846D]',
  pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  em_processamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export const ORIGEM_OPTIONS: { value: EntradaOrigem; label: string }[] = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'empreiteira', label: 'Empreiteira' },
  { value: 'outros', label: 'Outros' },
];

export const TIPO_RECEITA_OPTIONS: { value: EntradaTipoReceita; label: string }[] = [
  { value: 'taxa_medicao', label: 'Taxa sobre medição' },
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'outros_servicos', label: 'Outros serviços' },
];

export const STATUS_OPTIONS: { value: EntradaStatus; label: string }[] = [
  { value: 'recebido', label: 'Recebido' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_processamento', label: 'Em processamento' },
];

export const PERIOD_OPTIONS: { value: EntradaPeriodo; label: string }[] = [
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: '3meses', label: '3 meses' },
  { value: '12meses', label: '12 meses' },
  { value: 'personalizado', label: 'Personalizado' },
];

export const PAGE_SIZE = 20;
