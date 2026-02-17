import {
  RiGroupLine,
  RiWalletLine,
  RiBuilding2Line,
  RiLineChartLine,
  RiArrowDownLine,
  RiMegaphoneLine,
  RiQuestionLine,
  RiSettings3Line,
  RiLayout2Line,
} from 'react-icons/ri';
import { LuHardHat } from 'react-icons/lu';
import type { IconType } from 'react-icons';

export interface AppNavItem {
  title: string;
  url: string;
  icon: IconType;
}

export const APP_SIDEBAR_NAV_ITEMS: AppNavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: RiLayout2Line },
  { title: 'Clientes', url: '/dashboard/clientes', icon: RiGroupLine },
  { title: 'Empreiteiras', url: '/dashboard/empreiteiras', icon: LuHardHat },
  { title: 'Obras', url: '/dashboard/obras', icon: RiBuilding2Line },
  { title: 'Financeiro', url: '/dashboard/financeiro', icon: RiWalletLine },
  { title: 'Entradas', url: '/dashboard/entradas', icon: RiLineChartLine },
  { title: 'Saídas', url: '/dashboard/saidas', icon: RiArrowDownLine },
  { title: 'Anúncios', url: '/dashboard/anuncios', icon: RiMegaphoneLine },
];

export const APP_SIDEBAR_BOTTOM_NAV_ITEMS: AppNavItem[] = [
  { title: 'Perguntas Frequentes', url: '/dashboard/faq', icon: RiQuestionLine },
  { title: 'Configurações', url: '/dashboard/config', icon: RiSettings3Line },
];
