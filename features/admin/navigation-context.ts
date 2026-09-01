import {
  getAdminEscopo,
  type AdminEscopo,
  type AdminScopeActor,
} from '@features/auth/api/admin-scope';
import type { LogoutOptions } from '@features/auth/store/auth-store';

export interface AdminNavigationContext {
  escopo: AdminEscopo;
  isXgestao: boolean;
}

export interface AdminTopbarControls {
  showGlobalSearch: boolean;
  showGlobalNotifications: boolean;
  showGlobalAccountLinks: boolean;
}

interface ScopedNavigationItem {
  escopos?: AdminEscopo[];
}

export function isAdminXgestaoPath(pathname: string): boolean {
  return pathname === '/admin/xgestao' || pathname.startsWith('/admin/xgestao/');
}

/**
 * O shell visual segue o produto aberto; a autorização continua seguindo o
 * escopo do ator. Assim um admin global vê um xgestão enxuto nesta rota sem
 * perder suas permissões no marketplace.
 */
export function getAdminNavigationContext(
  actor: AdminScopeActor | null | undefined,
  pathname: string,
): AdminNavigationContext {
  const escopo = getAdminEscopo(actor);
  const isXgestao = escopo === 'xgestao' || isAdminXgestaoPath(pathname);

  return {
    escopo,
    isXgestao,
  };
}

export function getVisibleAdminNavigationItems<T extends ScopedNavigationItem>(
  items: T[],
  context: AdminNavigationContext,
): T[] {
  if (context.isXgestao) {
    return items.filter((item) => (item.escopos ?? ['global']).includes('xgestao'));
  }

  if (context.escopo === 'global') return items;

  return items.filter((item) =>
    (item.escopos ?? ['global']).includes(context.escopo),
  );
}

export function getAdminTopbarControls(
  context: AdminNavigationContext,
): AdminTopbarControls {
  const showGlobalControls = !context.isXgestao;

  return {
    showGlobalSearch: showGlobalControls,
    showGlobalNotifications: showGlobalControls,
    showGlobalAccountLinks: showGlobalControls,
  };
}

export function getAdminLogoutOptions(
  context: AdminNavigationContext,
): LogoutOptions | undefined {
  return context.isXgestao
    ? { persona: 'xgestao', next: '/admin/xgestao' }
    : undefined;
}