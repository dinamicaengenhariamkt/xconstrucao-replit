export const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export const ADMIN_FAQ_CATEGORIES: Record<string, string> = {
  usuarios: 'Cadastro e Gestão de Usuários',
  clientes: 'Clientes (Contratantes)',
  empreiteiras: 'Empreiteiras',
  financeiro: 'Financeiro e Caixa',
  obras: 'Obras e Operação',
  configuracoes: 'Configurações da Plataforma',
};

export const ADMIN_FAQ_VISAO_LABELS: Record<string, string> = {
  contratante: 'Contratante',
  empreiteiro: 'Empreiteiro',
  ambos: 'Ambas as visões',
};

export const ADMIN_FAQ_VISAO_COLORS: Record<string, string> = {
  contratante: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  empreiteiro: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ambos: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export const ADMIN_FAQ_CATEGORY_META: Record<string, {
  description: string;
  iconBg: string;
  iconColor: string;
}> = {
  usuarios: {
    description: 'Clientes, empreiteiras e administradores internos.',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600',
  },
  clientes: {
    description: 'Cadastro, status, obras e relacionamento.',
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600',
  },
  empreiteiras: {
    description: 'Curadoria, aprovação, bloqueios e obras vinculadas.',
    iconBg: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600',
  },
  financeiro: {
    description: 'Entradas, saídas, taxas e fluxo de caixa.',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600',
  },
  obras: {
    description: 'Vínculo cliente-empreiteira, risco, status de obras.',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-500',
  },
  configuracoes: {
    description: 'Planos, parâmetros, integrações e segurança.',
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600',
  },
};
