import type { IconType } from 'react-icons';
import {
  RiUserLine,
  RiGlobalLine,
  RiWalletLine,
} from 'react-icons/ri';

export const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

export const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

// Reflete a projeção `visao IN ('contratante','ambos') AND ativo=true` do modelo
// admin (AdminFAQItem). Categorias específicas de empreiteiro não aparecem aqui.
export const CONTRATANTE_FAQ_CATEGORIES: Record<string, string> = {
  contratantes: 'Para Contratantes',
  plataforma: 'Sobre a Plataforma',
  pagamentos: 'Pagamentos',
};

export const CONTRATANTE_FAQ_CATEGORY_META: Record<string, {
  description: string;
  iconBg: string;
  iconColor: string;
}> = {
  contratantes: {
    description: 'Publicação de obras, seleção e avaliação de empreiteiros.',
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600',
  },
  plataforma: {
    description: 'Funcionamento, segurança e disponibilidade da plataforma.',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600',
  },
  pagamentos: {
    description: 'Liberação por etapa, métodos aceitos e nota fiscal.',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600',
  },
};

export const CONTRATANTE_FAQ_CATEGORY_ICONS: Record<string, IconType> = {
  contratantes: RiUserLine,
  plataforma: RiGlobalLine,
  pagamentos: RiWalletLine,
};

export const CONTRATANTE_FAQ_SUBTITLE =
  'Tire suas dúvidas sobre publicar obras, escolher empreiteiros e acompanhar pagamentos.';
