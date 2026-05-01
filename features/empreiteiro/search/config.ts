import {
  RiHammerLine,
  RiBriefcaseLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';
import type { SearchConfig } from '@features/shared/search/types';
import type { EmpreiteiroSearchCategory } from './hooks/use-global-search';

export const EMPREITEIRO_SEARCH_CONFIG: SearchConfig<EmpreiteiroSearchCategory> = {
  placeholder: 'Buscar minhas obras, novas obras ou medições...',
  triggerLabel: 'Buscar obras, contratantes, medições…',
  categoryIcon: {
    'minhas-obras': RiHammerLine,
    'novas-obras': RiBriefcaseLine,
    medicoes: RiMoneyDollarCircleLine,
  },
  categoryIconBg: {
    'minhas-obras': 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    'novas-obras': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    medicoes: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  quickLinks: [
    { label: 'Ir para Minhas Obras', href: '/empreiteiro/minhas-obras', category: 'minhas-obras' },
    { label: 'Ir para Novas Obras', href: '/empreiteiro/novas-obras', category: 'novas-obras' },
    { label: 'Ir para Pagamentos', href: '/empreiteiro/pagamentos', category: 'medicoes' },
  ],
};
