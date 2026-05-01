import {
  RiUserLine,
  RiBuilding2Line,
  RiHammerLine,
  RiArrowRightUpLine,
  RiArrowRightDownLine,
} from 'react-icons/ri';
import type { SearchConfig } from '@features/shared/search/types';
import type { AdminSearchCategory } from './hooks/use-global-search';

export const ADMIN_SEARCH_CONFIG: SearchConfig<AdminSearchCategory> = {
  placeholder: 'Buscar clientes, empreiteiras, obras, entradas ou saídas...',
  triggerLabel: 'Buscar clientes, empreiteiras, obras…',
  categoryIcon: {
    clientes: RiUserLine,
    empreiteiras: RiBuilding2Line,
    obras: RiHammerLine,
    entradas: RiArrowRightUpLine,
    saidas: RiArrowRightDownLine,
  },
  categoryIconBg: {
    clientes: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    empreiteiras: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    obras: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    entradas: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    saidas: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
  quickLinks: [
    { label: 'Ir para Clientes', href: '/admin/clientes', category: 'clientes' },
    { label: 'Ir para Empreiteiras', href: '/admin/empreiteiras', category: 'empreiteiras' },
    { label: 'Ir para Obras', href: '/admin/obras', category: 'obras' },
    { label: 'Ir para Entradas', href: '/admin/entradas', category: 'entradas' },
    { label: 'Ir para Saídas', href: '/admin/saidas', category: 'saidas' },
  ],
};
