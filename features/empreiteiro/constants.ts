import {
  RiBuilding2Line,
  RiLayout2Line,
  RiSearchLine,
  RiChat3Line,
  RiQuestionLine,
  RiSettings3Line,
} from 'react-icons/ri';
import type { NavItem } from './types';

export const EMPREITEIRO_NAV_ITEMS: NavItem[] = [
  { title: 'Minhas Obras', url: '/empreiteiro/minhas-obras', icon: RiBuilding2Line },
  { title: 'Dashboard', url: '/empreiteiro/dashboard', icon: RiLayout2Line },
  { title: 'Novas Obras Disponíveis', url: '/empreiteiro/novas-obras', icon: RiSearchLine },
  { title: 'xchat', url: '/empreiteiro/chat', icon: RiChat3Line },
];

export const EMPREITEIRO_BOTTOM_NAV_ITEMS: NavItem[] = [
  { title: 'Perguntas Frequentes', url: '/empreiteiro/faq', icon: RiQuestionLine },
  { title: 'Configurações', url: '/empreiteiro/config', icon: RiSettings3Line },
];
