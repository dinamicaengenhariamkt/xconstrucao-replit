import {
  RiUserLine,
  RiTeamLine,
  RiMoneyDollarCircleLine,
  RiWalletLine,
  RiArrowUpCircleLine,
  RiArrowDownCircleLine,
  RiMegaphoneLine,
  RiQuestionLine,
  RiSettings3Line,
} from 'react-icons/ri';
import type { NavItem } from './types';

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { title: 'Cliente', url: '/admin/clientes', icon: RiUserLine },
  { title: 'Empreiteira', url: '/admin/empreiteiras', icon: RiTeamLine },
  { title: 'Financeiro', url: '/admin/financeiro', icon: RiMoneyDollarCircleLine },
  { title: 'Caixa', url: '/admin/caixa', icon: RiWalletLine },
  { title: 'Entradas', url: '/admin/entradas', icon: RiArrowUpCircleLine },
  { title: 'Saídas', url: '/admin/saidas', icon: RiArrowDownCircleLine },
  { title: 'Anúncios', url: '/admin/anuncios', icon: RiMegaphoneLine },
];

export const ADMIN_BOTTOM_NAV_ITEMS: NavItem[] = [
  { title: 'Perguntas Frequentes', url: '/admin/faq', icon: RiQuestionLine },
  { title: 'Configurações', url: '/admin/config', icon: RiSettings3Line },
];
