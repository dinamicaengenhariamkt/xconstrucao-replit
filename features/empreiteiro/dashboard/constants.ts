/**
 * Constants e Feature Flags para o Dashboard do Empreiteiro
 */

// Feature flag para ativar/desativar mocks

// Cores do dashboard (alinhadas com o design system)
export const DASHBOARD_COLORS = {
  primary: 'hsl(var(--primary))',
  success: '#22846D',
  warning: '#F5A623',
  error: '#E53935',
  info: '#1E88E5',
  amber: '#F59E0B',
} as const;

// Configurações de animação
export const ANIMATION_CONFIG = {
  duration: {
    fast: 0.15,
    normal: 0.2,
    slow: 0.3,
  },
  stagger: {
    children: 0.1,
  },
} as const;

// Mapeamento de cores por tipo de atividade
export const ACTIVITY_COLORS = {
  payment: 'info',
  milestone: 'success',
  delivery: 'amber',
  contract: 'primary',
  alert: 'error',
} as const;

// Configurações de formato
export const FORMAT_CONFIG = {
  currency: {
    locale: 'pt-BR',
    currency: 'BRL',
  },
  date: {
    locale: 'pt-BR',
  },
} as const;

// Configuração de cache do React Query (estratégia balanceada)
export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutos - reduz refetch desnecessário
  refetchOnWindowFocus: true, // Refetch ao focar na janela
} as const;
