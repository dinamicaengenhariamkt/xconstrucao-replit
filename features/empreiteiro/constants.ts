import {
  RiBuilding2Line,
  RiLayout2Line,
  RiSearchLine,
  RiChat3Line,
  RiQuestionLine,
  RiSettings3Line,
  RiBookmarkLine,
  RiWalletLine,
  RiFileList3Line,
  RiVipCrownLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';
import type { NavItem } from './types';

export const EMPREITEIRO_NAV_ITEMS: NavItem[] = [
  { title: 'Minhas Obras', url: '/empreiteiro/minhas-obras', icon: RiBuilding2Line },
  { title: 'Dashboard', url: '/empreiteiro/dashboard', icon: RiLayout2Line },
  { title: 'Novas Obras Disponíveis', url: '/empreiteiro/novas-obras', icon: RiSearchLine },
  { title: 'Obras Salvas', url: '/empreiteiro/obras-salvas', icon: RiBookmarkLine },
  { title: 'Minhas Candidaturas', url: '/empreiteiro/minhas-candidaturas', icon: RiFileList3Line },
  { title: 'Meus Recebimentos', url: '/empreiteiro/pagamentos', icon: RiWalletLine },
  { title: 'Meu Saldo', url: '/empreiteiro/saldo', icon: RiMoneyDollarCircleLine },
  { title: 'xchat', url: '/empreiteiro/chat', icon: RiChat3Line },
  { title: 'Planos', url: '/empreiteiro/planos', icon: RiVipCrownLine },
];

export const EMPREITEIRO_BOTTOM_NAV_ITEMS: NavItem[] = [
  { title: 'Perguntas Frequentes', url: '/empreiteiro/faq', icon: RiQuestionLine },
  { title: 'Configurações', url: '/empreiteiro/configuracoes', icon: RiSettings3Line },
];

const MARKETPLACE_NAV_URLS = new Set([
  '/empreiteiro/novas-obras',
  '/empreiteiro/obras-salvas',
  '/empreiteiro/minhas-candidaturas',
  '/empreiteiro/pagamentos',
  '/empreiteiro/saldo',
]);

/** Mantém as rotas existentes, mas pode ocultar sua descoberta no lançamento xgestão. */
export function getEmpreiteiroNavItems(marketplaceVisivel: boolean): NavItem[] {
  return marketplaceVisivel
    ? EMPREITEIRO_NAV_ITEMS
    : EMPREITEIRO_NAV_ITEMS.filter((item) => !MARKETPLACE_NAV_URLS.has(item.url));
}
