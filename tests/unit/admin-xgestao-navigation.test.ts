import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getAdminNavigationContext,
  getAdminTopbarControls,
  getVisibleAdminNavigationItems,
  isAdminXgestaoPath,
} from '@features/admin/navigation-context';
import {
  ADMIN_BOTTOM_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
} from '@features/admin/constants';

describe('navegação administrativa do xgestão', () => {
  it('usa shell enxuto para admin global dentro do xgestão', () => {
    const context = getAdminNavigationContext(
      { role: 'admin', adminEscopo: 'global' },
      '/admin/xgestao',
    );
    assert.deepEqual(context, {
      escopo: 'global',
      isXgestao: true,
      canReturnToMarketplace: true,
    });
    assert.deepEqual(
      getVisibleAdminNavigationItems(ADMIN_NAV_ITEMS, context).map(
        (item) => item.title,
      ),
      ['xgestão'],
    );
    assert.deepEqual(
      getVisibleAdminNavigationItems(ADMIN_BOTTOM_NAV_ITEMS, context),
      [],
    );
    assert.deepEqual(getAdminTopbarControls(context), {
      showGlobalSearch: false,
      showGlobalNotifications: false,
      showGlobalAccountLinks: false,
    });
  });

  it('mantém o shell completo do marketplace nas rotas globais', () => {
    const context = getAdminNavigationContext(
      { role: 'admin', adminEscopo: 'global' },
      '/admin/financeiro',
    );
    assert.deepEqual(context, {
      escopo: 'global',
      isXgestao: false,
      canReturnToMarketplace: false,
    });
    assert.equal(
      getVisibleAdminNavigationItems(ADMIN_NAV_ITEMS, context).length,
      ADMIN_NAV_ITEMS.length,
    );
    assert.equal(
      getVisibleAdminNavigationItems(ADMIN_BOTTOM_NAV_ITEMS, context).length,
      ADMIN_BOTTOM_NAV_ITEMS.length,
    );
    assert.deepEqual(getAdminTopbarControls(context), {
      showGlobalSearch: true,
      showGlobalNotifications: true,
      showGlobalAccountLinks: true,
    });
  });

  it('não oferece retorno ao marketplace para admin restrito', () => {
    assert.deepEqual(
      getAdminNavigationContext(
        { role: 'admin', adminEscopo: 'xgestao' },
        '/admin/xgestao',
      ),
      {
        escopo: 'xgestao',
        isXgestao: true,
        canReturnToMarketplace: false,
      },
    );
    assert.deepEqual(
      getAdminTopbarControls(
        getAdminNavigationContext(
          { role: 'admin', adminEscopo: 'xgestao' },
          '/admin/xgestao',
        ),
      ),
      {
        showGlobalSearch: false,
        showGlobalNotifications: false,
        showGlobalAccountLinks: false,
      },
    );
  });

  it('preserva o superadmin global e reconhece rotas filhas do produto', () => {
    assert.deepEqual(
      getAdminNavigationContext(
        { role: 'superadmin', adminEscopo: 'xgestao' },
        '/admin/xgestao/assinantes',
      ),
      {
        escopo: 'global',
        isXgestao: true,
        canReturnToMarketplace: true,
      },
    );
    assert.equal(isAdminXgestaoPath('/admin/xgestao-interno'), false);
  });
});