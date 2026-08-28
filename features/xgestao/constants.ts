import {
  RiBuilding4Line,
  RiDashboardLine,
  RiSettings3Line,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';

export type XGestaoNavItem = {
  title: string;
  url: string;
  icon: IconType;
  description: string;
};

export const XGESTAO_NAV_ITEMS: XGestaoNavItem[] = [
  {
    title: 'Dashboard',
    url: '/xgestao/dashboard',
    icon: RiDashboardLine,
    description: 'Visão geral da operação',
  },
  {
    title: 'Minhas Obras',
    url: '/xgestao/obras',
    icon: RiBuilding4Line,
    description: 'Obras e frentes de trabalho',
  },
];

export const XGESTAO_BOTTOM_NAV_ITEMS: XGestaoNavItem[] = [
  {
    title: 'Configurações',
    url: '/xgestao/configuracoes',
    icon: RiSettings3Line,
    description: 'Preferências e acesso',
  },
];