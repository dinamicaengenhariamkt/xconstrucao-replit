import {
  RiAddBoxLine,
  RiBuildingLine,
  RiDashboardLine,
  RiChat1Line,
  RiQuestionLine,
  RiSettings3Line,
  RiMoneyDollarCircleLine,
  RiFileList3Line,
  RiVipCrownLine,
} from 'react-icons/ri';
import type { NavItem } from './types';

export const CONTRATANTE_NAV_ITEMS: NavItem[] = [
  { title: 'Nova Obra', url: '/contratante/nova-obra', icon: RiAddBoxLine },
  { title: 'Minhas Obras', url: '/contratante/minhas-obras', icon: RiBuildingLine },
  { title: 'Dashboard', url: '/contratante/dashboard', icon: RiDashboardLine },
  { title: 'Medições', url: '/contratante/medicoes', icon: RiFileList3Line },
  { title: 'Pagamentos', url: '/contratante/pagamentos', icon: RiMoneyDollarCircleLine },
  { title: 'xchat', url: '/contratante/chat', icon: RiChat1Line },
  { title: 'Planos', url: '/contratante/planos', icon: RiVipCrownLine },
];

export const CONTRATANTE_BOTTOM_NAV_ITEMS: NavItem[] = [
  { title: 'Perguntas Frequentes', url: '/contratante/faq', icon: RiQuestionLine },
  { title: 'Configurações', url: '/contratante/configuracoes', icon: RiSettings3Line },
];
