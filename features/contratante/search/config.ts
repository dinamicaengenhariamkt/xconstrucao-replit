import { RiHammerLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
import type { SearchConfig } from '@features/shared/search/types';
import type { ContratanteSearchCategory } from './hooks/use-global-search';

export const CONTRATANTE_SEARCH_CONFIG: SearchConfig<ContratanteSearchCategory> = {
  placeholder: 'Buscar minhas obras, empreiteiros ou pagamentos...',
  triggerLabel: 'Buscar obras, empreiteiros, pagamentos…',
  categoryIcon: {
    obras: RiHammerLine,
    pagamentos: RiMoneyDollarCircleLine,
  },
  categoryIconBg: {
    obras: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    pagamentos: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  quickLinks: [
    { label: 'Ir para Minhas Obras', href: '/contratante/minhas-obras', category: 'obras' },
    { label: 'Ir para Pagamentos', href: '/contratante/pagamentos', category: 'pagamentos' },
  ],
};
