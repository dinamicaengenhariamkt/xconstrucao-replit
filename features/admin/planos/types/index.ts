export type PlanoUsuarioPerfil = 'contratante' | 'empreiteiro';
export type PlanoStatus = 'ativo' | 'inativo' | 'trial' | 'cancelado';

export const PLANO_STATUS_LABEL: Record<PlanoStatus, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  trial: 'Trial',
  cancelado: 'Cancelado',
};

export const PLANO_STATUS_COLOR: Record<PlanoStatus, string> = {
  ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  inativo: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export interface AdminPlano {
  id: string;
  nome: string;
  perfil: PlanoUsuarioPerfil;
  preco: number;
  totalAssinantes: number;
  assinantesAtivos: number;
  features: string[];
  ativo: boolean;
}

export interface AdminPlanoAssinante {
  id: string;
  nome: string;
  email: string;
  planoNome: string;
  perfil: PlanoUsuarioPerfil;
  dataAdesao: string;
  status: PlanoStatus;
  valorMensal: number;
}

export interface PlanosKpi {
  totalAssinantes: number;
  receitaMensal: number;
  churnMes: number;
  enterprise: number;
}
