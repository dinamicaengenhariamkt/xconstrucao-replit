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
  RiShieldCheckLine,
  RiChat3Line,
  RiUserHeartLine,
  RiStarLine,
  RiFileTextLine,
  RiFileList3Line,
  RiHeartPulseLine,
} from 'react-icons/ri';
import type { NavItem } from './types';

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { title: 'Cliente', url: '/admin/clientes', icon: RiUserLine },
  { title: 'Empreiteira', url: '/admin/empreiteiras', icon: RiBuilding2Line },
  { title: 'Obras', url: '/admin/obras', icon: RiHammerLine },
  { title: 'Moderação', url: '/admin/obras/moderacao', icon: RiShieldCheckLine },
  { title: 'Destaques', url: '/admin/obras-destaque', icon: RiStarLine },
  { title: 'Disputas', url: '/admin/disputas', icon: RiAlertLine },
  { title: 'Comunicação', url: '/admin/comunicacao', icon: RiChat3Line },
  { title: 'Financeiro', url: '/admin/financeiro', icon: RiMoneyDollarCircleLine },
  { title: 'Caixa', url: '/admin/caixa', icon: RiWalletLine },
  { title: 'Entradas', url: '/admin/entradas', icon: RiArrowUpLine },
  { title: 'Saídas', url: '/admin/saidas', icon: RiArrowDownLine },
  { title: 'Anúncios', url: '/admin/anuncios', icon: RiMegaphoneLine },
  { title: 'Leads', url: '/admin/marketplace-leads', icon: RiUserHeartLine },
  { title: 'Saúde', url: '/admin/saude', icon: RiHeartPulseLine },
];

export const ADMIN_BOTTOM_NAV_ITEMS: NavItem[] = [
  { title: 'Planos', url: '/admin/planos', icon: RiVipCrownLine },
  { title: 'Perguntas Frequentes', url: '/admin/faq', icon: RiQuestionLine },
  { title: 'Documentos Legais', url: '/admin/legal', icon: RiFileTextLine },
  { title: 'Contratos', url: '/admin/contratos', icon: RiFileList3Line },
  { title: 'Auditoria', url: '/admin/auditoria', icon: RiHistoryLine },
  { title: 'Configurações', url: '/admin/configuracoes', icon: RiSettings3Line },
];
