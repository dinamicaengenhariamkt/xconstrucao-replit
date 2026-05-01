import type { SaidaTipo, SaidaStatus, SaidaDestinoPerfil, SaidaPeriodo } from './types';

export const tipoSaidaLabels: Record<SaidaTipo, string> = {
  pagamento_medicao: 'Pagamento de medição',
  reembolso: 'Reembolso',
  custo_operacional: 'Custo operacional',
};

export const tipoSaidaClasses: Record<SaidaTipo, string> = {
  pagamento_medicao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  reembolso: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  custo_operacional: 'bg-primary/10 text-primary',
};

export const statusLabels: Record<SaidaStatus, string> = {
  pago: 'Pago',
  agendado: 'Agendado',
  pendente_aprovacao: 'Pendente aprovação',
  atrasado: 'Atrasado',
};

export const statusClasses: Record<SaidaStatus, string> = {
  pago: 'bg-[#22846D]/10 text-[#22846D]',
  agendado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pendente_aprovacao: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  atrasado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const destinoPerfilLabels: Record<SaidaDestinoPerfil, string> = {
  empreiteira: 'Empreiteira',
  cliente: 'Cliente',
  outro: 'Outro',
};

export const destinoPerfilClasses: Record<SaidaDestinoPerfil, string> = {
  empreiteira: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cliente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  outro: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export const TIPO_SAIDA_OPTIONS: { value: SaidaTipo; label: string }[] = [
  { value: 'pagamento_medicao', label: 'Pagamento de medição' },
  { value: 'reembolso', label: 'Reembolso' },
  { value: 'custo_operacional', label: 'Custo operacional' },
];

export const DESTINO_PERFIL_OPTIONS: { value: SaidaDestinoPerfil; label: string }[] = [
  { value: 'empreiteira', label: 'Empreiteira' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'outro', label: 'Outro' },
];

export const STATUS_OPTIONS: { value: SaidaStatus; label: string }[] = [
  { value: 'pago', label: 'Pago' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'pendente_aprovacao', label: 'Pendente aprovação' },
  { value: 'atrasado', label: 'Atrasado' },
];

export const SEM_OBRA = '__sem_obra__';

export const PERIOD_OPTIONS: { value: SaidaPeriodo; label: string }[] = [
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: '3meses', label: '3 meses' },
  { value: '12meses', label: '12 meses' },
  { value: 'personalizado', label: 'Personalizado' },
];

export const PAGE_SIZE = 20;
export const PAGE_SIZE_FUTURAS = 8;
