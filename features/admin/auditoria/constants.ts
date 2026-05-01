import {
  RiLoginCircleLine,
  RiLogoutCircleLine,
  RiUserAddLine,
  RiEdit2Line,
  RiProhibitedLine,
  RiBuilding2Line,
  RiHammerLine,
  RiMoneyDollarCircleLine,
  RiVipCrownLine,
  RiSettings3Line,
  RiServerLine,
} from 'react-icons/ri';
import type {
  AuditoriaEventTipo,
  AuditoriaModulo,
  AuditoriaCategoria,
} from './types';

export const INITIAL_DAYS = 3;
export const DAYS_INCREMENT = 3;

export type EventoConfig = { icon: React.ElementType; bgColor: string };

export const EVENTO_CONFIG: Record<AuditoriaEventTipo, EventoConfig> = {
  login: { icon: RiLoginCircleLine, bgColor: 'bg-emerald-500' },
  logout: { icon: RiLogoutCircleLine, bgColor: 'bg-gray-400' },
  cliente_criado: { icon: RiUserAddLine, bgColor: 'bg-blue-500' },
  cliente_editado: { icon: RiEdit2Line, bgColor: 'bg-blue-400' },
  cliente_bloqueado: { icon: RiProhibitedLine, bgColor: 'bg-red-500' },
  empreiteira_criada: { icon: RiBuilding2Line, bgColor: 'bg-indigo-500' },
  empreiteira_bloqueada: { icon: RiProhibitedLine, bgColor: 'bg-red-600' },
  obra_criada: { icon: RiHammerLine, bgColor: 'bg-amber-500' },
  obra_atualizada: { icon: RiEdit2Line, bgColor: 'bg-amber-400' },
  pagamento_registrado: { icon: RiMoneyDollarCircleLine, bgColor: 'bg-emerald-600' },
  configuracao_alterada: { icon: RiSettings3Line, bgColor: 'bg-slate-500' },
  plano_alterado: { icon: RiVipCrownLine, bgColor: 'bg-purple-500' },
  sistema: { icon: RiServerLine, bgColor: 'bg-gray-600' },
};

export const TIPO_LABEL: Record<AuditoriaEventTipo, string> = {
  login: 'Login',
  logout: 'Logout',
  cliente_criado: 'Cliente criado',
  cliente_editado: 'Cliente editado',
  cliente_bloqueado: 'Cliente bloqueado',
  empreiteira_criada: 'Empreiteira criada',
  empreiteira_bloqueada: 'Empreiteira bloqueada',
  obra_criada: 'Obra criada',
  obra_atualizada: 'Obra atualizada',
  pagamento_registrado: 'Pagamento registrado',
  configuracao_alterada: 'Configuração alterada',
  plano_alterado: 'Plano alterado',
  sistema: 'Sistema',
};

export const MODULO_LABEL: Record<AuditoriaModulo, string> = {
  clientes: 'Clientes',
  empreiteiras: 'Empreiteiras',
  obras: 'Obras',
  financeiro: 'Financeiro',
  planos: 'Planos',
  configuracoes: 'Configurações',
  sistema: 'Sistema',
};

export const CATEGORIA_LABEL: Record<AuditoriaCategoria, string> = {
  risco: 'Risco',
  financeiro: 'Financeiro',
  acesso: 'Acesso',
  mudanca: 'Mudança',
  sistema: 'Sistema',
};

export const CATEGORIA_BADGE_CLASS: Record<AuditoriaCategoria, string> = {
  risco: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  financeiro: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  acesso: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  mudanca: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sistema: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function getCategoria(tipo: AuditoriaEventTipo): AuditoriaCategoria {
  switch (tipo) {
    case 'cliente_bloqueado':
    case 'empreiteira_bloqueada':
    case 'configuracao_alterada':
      return 'risco';
    case 'pagamento_registrado':
      return 'financeiro';
    case 'login':
    case 'logout':
      return 'acesso';
    case 'cliente_criado':
    case 'cliente_editado':
    case 'obra_criada':
    case 'obra_atualizada':
    case 'empreiteira_criada':
    case 'plano_alterado':
      return 'mudanca';
    case 'sistema':
    default:
      return 'sistema';
  }
}

export const TIPO_OPTIONS: { value: AuditoriaEventTipo; label: string }[] = (
  Object.entries(TIPO_LABEL) as [AuditoriaEventTipo, string][]
).map(([value, label]) => ({ value, label }));

export const MODULO_OPTIONS: { value: AuditoriaModulo; label: string }[] = (
  Object.entries(MODULO_LABEL) as [AuditoriaModulo, string][]
).map(([value, label]) => ({ value, label }));

export const CATEGORIA_OPTIONS: { value: AuditoriaCategoria; label: string }[] = (
  Object.entries(CATEGORIA_LABEL) as [AuditoriaCategoria, string][]
).map(([value, label]) => ({ value, label }));
