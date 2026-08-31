import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const pageSource = readFileSync('app/admin/xgestao/page.tsx', 'utf8');
const sidebarSource = readFileSync('features/admin/components/AdminSidebar.tsx', 'utf8');
const constantsSource = readFileSync('features/admin/constants.ts', 'utf8');

describe('estrutura do painel admin xgestão', () => {
  it('mantém as quatro visões resumidas do produto', () => {
    assert.match(pageSource, /data-testid="xgestao-operacao-resumo"/);
    assert.match(pageSource, /data-testid="xgestao-financeiro-resumo"/);
    assert.match(pageSource, /data-testid="xgestao-obras-recentes"/);
    assert.match(pageSource, /data-testid="xgestao-alertas"/);
  });

  it('não oferece retorno direto ao marketplace no shell xgestão', () => {
    assert.doesNotMatch(sidebarSource, /Voltar ao marketplace/);
    assert.doesNotMatch(constantsSource, /Voltar ao marketplace/);
    assert.doesNotMatch(constantsSource, /ADMIN_MARKETPLACE_RETURN_ITEM/);
  });
});