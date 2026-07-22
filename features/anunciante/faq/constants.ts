import type { IconType } from 'react-icons';
import { RiMegaphoneLine, RiGlobalLine, RiWalletLine } from 'react-icons/ri';

export const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

// Reflete a projeção `visao IN ('anunciante','ambos') AND ativo=true`. As FAQs do
// anunciante são semeadas com category 'anuncios'; itens 'ambos' podem trazer as
// categorias de plataforma/pagamentos compartilhadas.
export const ANUNCIANTE_FAQ_CATEGORIES: Record<string, string> = {
  anuncios: 'Anúncios',
  plataforma: 'Sobre a Plataforma',
  pagamentos: 'Pagamentos',
};

export const ANUNCIANTE_FAQ_CATEGORY_META: Record<string, {
  description: string;
  iconBg: string;
  iconColor: string;
}> = {
  anuncios: {
    description: 'Como criar anúncios, escolher zonas, moderação e pagamento.',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600',
  },
  plataforma: {
    description: 'Funcionamento, segurança e disponibilidade da plataforma.',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600',
  },
  pagamentos: {
    description: 'Formas de pagamento, confirmação e veiculação.',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600',
  },
};

export const ANUNCIANTE_FAQ_CATEGORY_ICONS: Record<string, IconType> = {
  anuncios: RiMegaphoneLine,
  plataforma: RiGlobalLine,
  pagamentos: RiWalletLine,
};

export const ANUNCIANTE_FAQ_SUBTITLE =
  'Tire suas dúvidas sobre criar anúncios, escolher locais, moderação e pagamento.';
