import {
  getAdminEscopo,
  type AdminEscopo,
  type AdminScopeActor,
} from '@features/auth/api/admin-scope';

export interface AdminNavigationContext {
  escopo: AdminEscopo;
  isXgestao: boolean;
  canReturnToMarketplace: boolean;
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
    canReturnToMarketplace: isXgestao && escopo === 'global',
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