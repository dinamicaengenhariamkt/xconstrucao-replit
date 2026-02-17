export const ADMIN_DASHBOARD_COLORS = {
  primary: '#333333',
  success: '#22846D',
  warning: '#F5A623',
  error: '#E53935',
  info: '#1E88E5',
  gray: '#9ca3af',
} as const;

export const ANIMATION_CONFIG = {
  duration: {
    fast: 0.15,
    normal: 0.2,
    slow: 0.3,
  },
  stagger: {
    children: 0.08,
  },
} as const;

export const SITUACAO_CONFIG = {
  pagamento_atrasado: {
    label: 'Pagamento atrasado',
    className: 'bg-red-50 text-red-600 dark:bg-red-900/20',
  },
  medicao_pendente: {
    label: 'Medição pendente',
    className: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
  },
  em_dia: {
    label: 'Em dia',
    className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
  },
  obra_suspensa: {
    label: 'Obra suspensa',
    className: 'bg-gray-100 text-gray-500 dark:bg-gray-800',
  },
} as const;
