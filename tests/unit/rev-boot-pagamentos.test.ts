import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  PASSOS_ESSENCIAIS,
  passosParaRodar,
  sqlGarantirCheckIn,
  STATUS_TROCA,
} from '../../server/bootstrap-colunas-essenciais';
import {
  conferirGatewayPagamento,
  ehGatewayNaoConfigurado,
  getPaymentGateway,
  GatewayNaoConfiguradoError,
  _overrideGatewayForTest,
} from '../../features/planos/gateway';
import { ehProducao, rotasDeTesteHabilitadas } from '../../shared/lib/rotas-teste';

/**
 * REV-01 — bootstrap rápido das colunas essenciais (SQL idempotente).
 * REV-02 — gateway ausente em produção vira erro de configuração (503).
 * REV-12 — rotas /api/test/** sempre 404 em produção.
 */

test('REV-01 todo passo é idempotente (IF NOT EXISTS ou bloco DO que confere o catálogo)', () => {
  for (const p of PASSOS_ESSENCIAIS) {
    const idempotente = /IF NOT EXISTS|IF EXISTS/i.test(p.sql) || /^DO \$\$/.test(p.sql);
    assert.ok(idempotente, p.nome);
    // Troca de CONSTRAINT só dentro de bloco DO que confere o catálogo antes.
    if (/(DROP|ADD) CONSTRAINT/.test(p.sql)) assert.match(p.sql, /^DO \$\$[\s\S]*pg_constraint/, p.nome);
  }
});

test('REV-01 cobre as colunas e a tabela novas das migrations 0010 a 0014', () => {
  const tudo = PASSOS_ESSENCIAIS.map((p) => p.sql).join('\n');
  for (const coluna of [
    'conta_interna', 'xgestao_bloqueada_por_plano', 'pausado_por_plano', 'status_antes_pausa',
    'fim_teste_em', 'primeiro_pagamento_em', 'observacao_resolucao', 'atualizado_em', 'assinado_por_user_id',
    'CREATE TABLE IF NOT EXISTS assinatura_trocas', "'pausado'", "'pendente_gateway'",
    'motivo_cancelamento_texto', 'CREATE TABLE IF NOT EXISTS xgestao_admin_contatos',
  ]) {
    assert.ok(tudo.includes(coluna), coluna);
  }
});

test('REV-01 banco vazio: sem a tabela base o passo é pulado; tabela criada antes das CHECKs e índices', () => {
  assert.deepEqual(passosParaRodar(new Set()), []);
  const soUsers = passosParaRodar(new Set(['users']));
  assert.deepEqual(soUsers.map((p) => p.nome), ['users.conta_interna', 'users.marketing_consentimento', 'xgestao_emails_enviados']);
  const base = new Set(['users', 'empreiteiras', 'assinaturas', 'planos']);
  const nomes = passosParaRodar(base).map((p) => p.nome);
  assert.ok(nomes.includes('assinatura_trocas'));
  assert.ok(!nomes.some((n) => n.startsWith('assinatura_trocas.') || n.includes('índice')), 'sem a tabela, CHECK e índices esperam');
  const ordem = PASSOS_ESSENCIAIS.map((p) => p.nome);
  assert.ok(ordem.indexOf('assinatura_trocas') < ordem.indexOf('assinatura_trocas.status (pendente_gateway)'));
});

test('REV-11 CHECK só é trocada quando falta valor (sem DROP + ADD incondicional)', () => {
  const sql = sqlGarantirCheckIn('assinatura_trocas', 'assinatura_trocas_status_check', 'status', STATUS_TROCA);
  assert.match(sql, /^DO \$\$/);
  assert.match(sql, /FROM pg_constraint/);
  assert.match(sql, /THEN RETURN; END IF;\n  ALTER TABLE assinatura_trocas DROP CONSTRAINT IF EXISTS/);
  for (const v of STATUS_TROCA) assert.ok(sql.includes(`LIKE '%''${v}''%'`), v);
  assert.match(sql, /to_regclass\('public\.assinatura_trocas'\) IS NULL THEN RETURN/);
  assert.throws(() => sqlGarantirCheckIn('x; drop', 'c', 'status', ['a']), /identificador inválido/);
});

test('REV-10 chave de idempotência da troca é única por titular', () => {
  const tudo = PASSOS_ESSENCIAIS.map((p) => p.sql).join('\n');
  assert.match(tudo, /DROP INDEX IF EXISTS uq_assinatura_trocas_chave/);
  assert.match(tudo, /uq_assinatura_trocas_user_chave ON assinatura_trocas\(user_id, chave_idempotencia\)/);
});

test('REV-02 gateway em produção: ausente ou diferente de asaas é erro de configuração', () => {
  assert.deepEqual(conferirGatewayPagamento({ NODE_ENV: 'production', PAYMENT_GATEWAY: 'asaas' }), { ok: true, provider: 'asaas' });
  const ausente = conferirGatewayPagamento({ NODE_ENV: 'production' });
  assert.equal(ausente.ok, false);
  assert.match(!ausente.ok ? ausente.motivo : '', /PAYMENT_GATEWAY não definido em produção; pagamentos desligados/);
  assert.equal(conferirGatewayPagamento({ NODE_ENV: 'production', PAYMENT_GATEWAY: 'manual' }).ok, false);
  assert.equal(conferirGatewayPagamento({ NODE_ENV: 'production', PAYMENT_GATEWAY: 'stripe' }).ok, false);
  assert.equal(conferirGatewayPagamento({ NODE_ENV: 'production', PAYMENT_GATEWAY: ' ASAAS ' }).ok, true);
  // Fora de produção o manual segue padrão.
  assert.deepEqual(conferirGatewayPagamento({ NODE_ENV: 'development' }), { ok: true, provider: 'manual' });
});

test('REV-02 getPaymentGateway em produção sem gateway lança GatewayNaoConfigurado', () => {
  const env = process.env as Record<string, string | undefined>;
  const antes = { NODE_ENV: env.NODE_ENV, PAYMENT_GATEWAY: env.PAYMENT_GATEWAY };
  try {
    _overrideGatewayForTest(null);
    env.NODE_ENV = 'production';
    delete env.PAYMENT_GATEWAY;
    let capturado: unknown;
    try { getPaymentGateway(); } catch (err) { capturado = err; }
    assert.ok(capturado instanceof GatewayNaoConfiguradoError);
    assert.ok(ehGatewayNaoConfigurado(capturado));
    assert.equal((capturado as GatewayNaoConfiguradoError).code, 'GATEWAY_NAO_CONFIGURADO');
    assert.equal(ehGatewayNaoConfigurado(new Error('[asaas] HTTP 500')), false);
  } finally {
    for (const [k, v] of Object.entries(antes)) { if (v === undefined) delete env[k]; else env[k] = v; }
    _overrideGatewayForTest(null);
  }
});

test('REV-02 webhook com gateway não configurado responde 503 GATEWAY_NAO_CONFIGURADO (não 400)', async () => {
  const env = process.env as Record<string, string | undefined>;
  const antes = { NODE_ENV: env.NODE_ENV, PAYMENT_GATEWAY: env.PAYMENT_GATEWAY };
  try {
    _overrideGatewayForTest(null);
    env.NODE_ENV = 'production';
    delete env.PAYMENT_GATEWAY;
    const { POST } = await import('../../app/api/webhooks/gateway/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/webhooks/gateway', {
      method: 'POST', body: JSON.stringify({ event: 'PAYMENT_CONFIRMED', payment: { id: 'pay_x' } }),
    });
    const r = await POST(req);
    assert.equal(r.status, 503);
    assert.deepEqual(await r.json(), { error: 'GATEWAY_NAO_CONFIGURADO', code: 'GATEWAY_NAO_CONFIGURADO' });
  } finally {
    for (const [k, v] of Object.entries(antes)) { if (v === undefined) delete env[k]; else env[k] = v; }
    _overrideGatewayForTest(null);
  }
});

test('REV-12 rotas de teste: 404 em produção mesmo com E2E_TEST_AUTH=1', () => {
  assert.equal(rotasDeTesteHabilitadas({ NODE_ENV: 'production', E2E_TEST_AUTH: '1' }), false);
  assert.equal(rotasDeTesteHabilitadas({ NODE_ENV: 'development', E2E_TEST_AUTH: '1' }), true);
  assert.equal(rotasDeTesteHabilitadas({ NODE_ENV: 'development' }), false);
  assert.equal(ehProducao({ NODE_ENV: 'production' }), true);
});

test('REV-12 toda rota em app/api/test usa a guarda única', () => {
  const raiz = join(process.cwd(), 'app/api/test');
  const rotas: string[] = [];
  const andar = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) andar(p);
      else if (nome === 'route.ts') rotas.push(p);
    }
  };
  andar(raiz);
  assert.ok(rotas.length >= 9);
  for (const rota of rotas) {
    const fonte = readFileSync(rota, 'utf8');
    assert.ok(/rotasDeTesteHabilitadas\(\)|ehProducao\(\)/.test(fonte), rota);
    assert.doesNotMatch(fonte, /return process\.env\.E2E_TEST_AUTH === "1"/, rota);
  }
});
