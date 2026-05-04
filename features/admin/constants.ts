import {
  RiUserLine,
  RiBuilding2Line,
  RiMoneyDollarCircleLine,
  RiWalletLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiMegaphoneLine,
  RiQuestionLine,
  RiSettings3Line,
  RiHammerLine,
  RiVipCrownLine,
  RiHistoryLine,
  RiAlertLine,
} from 'react-icons/ri';
import type { NavItem } from './types';

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { title: 'Cliente', url: '/admin/clientes', icon: RiUserLine },
  { title: 'Empreiteira', url: '/admin/empreiteiras', icon: RiBuilding2Line },
  { title: 'Obras', url: '/admin/obras', icon: RiHammerLine },
  { title: 'Disputas', url: '/admin/disputas', icon: RiAlertLine },
  { title: 'Financeiro', url: '/admin/financeiro', icon: RiMoneyDollarCircleLine },
  { title: 'Caixa', url: '/admin/caixa', icon: RiWalletLine },
  { title: 'Entradas', url: '/admin/entradas', icon: RiArrowUpLine },
  { title: 'Saídas', url: '/admin/saidas', icon: RiArrowDownLine },
  { title: 'Anúncios', url: '/admin/anuncios', icon: RiMegaphoneLine },
];

export const ADMIN_BOTTOM_NAV_ITEMS: NavItem[] = [
  { title: 'Planos', url: '/admin/planos', icon: RiVipCrownLine },
  { title: 'Perguntas Frequentes', url: '/admin/faq', icon: RiQuestionLine },
  { title: 'Auditoria', url: '/admin/auditoria', icon: RiHistoryLine },
  { title: 'Configurações', url: '/admin/configuracoes', icon: RiSettings3Line },
];
