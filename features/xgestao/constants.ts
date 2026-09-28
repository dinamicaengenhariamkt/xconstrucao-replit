import {
  RiBuilding4Line,
  RiDashboardLine,
  RiTeamLine,
  RiSettings3Line,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';

// XG28 — as rotas de entrada moram em `./routes`, sem dependência de ícones:
// quem as consome é o `redirect-by-role`, no caminho de login.
export { XGESTAO_HOME, XGESTAO_HOME_ENCODED, XGESTAO_LOGIN_HREF, XGESTAO_OBRAS } from './routes';

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
  {
    title: 'Equipe',
    url: '/xgestao/equipe',
    icon: RiTeamLine,
    description: 'Acessos da equipe da empresa',
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