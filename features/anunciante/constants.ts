import {
  RiDashboardLine,
  RiMegaphoneLine,
  RiAddBoxLine,
  RiQuestionLine,
  RiSettings3Line,
} from 'react-icons/ri';
import type { NavItem } from '@features/contratante/types';

// J23 — navegação da visão dedicada de Anunciante (outsider puro). Cliente que
// também anuncia NÃO usa esta visão (vê "Meus Anúncios" embutido na própria visão).
export const ANUNCIANTE_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', url: '/anunciante/dashboard', icon: RiDashboardLine },
  { title: 'Meus Anúncios', url: '/anunciante/meus-anuncios', icon: RiMegaphoneLine },
  { title: 'Novo Pedido', url: '/anunciante/novo-pedido', icon: RiAddBoxLine },
];

export const ANUNCIANTE_BOTTOM_NAV_ITEMS: NavItem[] = [
  { title: 'Perguntas Frequentes', url: '/anunciante/faq', icon: RiQuestionLine },
  { title: 'Configurações', url: '/anunciante/configuracoes', icon: RiSettings3Line },
];
