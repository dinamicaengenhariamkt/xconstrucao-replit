import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  anualDisponivelXgestao,
  cicloDaAssinatura,
  mensalidadeEquivalente,
  mesesDoCiclo,
  valorDoCiclo,
} from '../../features/xgestao/lib/ciclo-plano';
import { CICLOS_PARA_ALERTA, JANELA_CICLOS_DIAS, retornoDoAssinante } from '../../features/xgestao/admin/lib/retorno-assinante';
import { aplicarSegmento, filtroSegmentoDaUrl } from '../../features/xgestao/admin/lib/segmentos-assinante';
import { PASSOS_ESSENCIAIS } from '../../server/bootstrap-colunas-essenciais';
import { primeiraCobrancaAoAssinar, somarMeses } from '../../features/xgestao/lib/acesso-plano';

/** XG50 — validação final do fluxo de pagamento (doc 50). */
const DIA = 24 * 60 * 60 * 1000;
const agora = new Date('2026-11-10T15:00:00Z');
const dias = (n: number) => new Date(agora.getTime() + n * DIA);

test('ciclo: anual cobra o ano, mensal a mensalidade; sem preço anual cai no mensal', () => {
  const plano = { valorMensal: '99.00', valorAnual: '990.00' };
  assert.equal(valorDoCiclo(plano, 'mensal'), 99);
  assert.equal(valorDoCiclo(plano, 'anual'), 990);
  assert.equal(valorDoCiclo({ valorMensal: 99, valorAnual: null }, 'anual'), 99);
  assert.equal(mesesDoCiclo('anual'), 12);
  assert.equal(mesesDoCiclo('mensal'), 1);
  assert.equal(mesesDoCiclo(null), 1);
  assert.equal(cicloDaAssinatura('qualquer'), 'mensal');
});

test('MRR: anual conta como valor anual / 12, arredondado a centavos', () => {
  assert.equal(mensalidadeEquivalente({ valorMensal: 99, valorAnual: 990 }, 'anual'), 82.5);
  assert.equal(mensalidadeEquivalente({ valorMensal: 179, valorAnual: 1790 }, 'anual'), 149.17);
  assert.equal(mensalidadeEquivalente({ valorMensal: 99, valorAnual: 990 }, 'mensal'), 99);
});

test('anual do xgestão: só com a chave ligada E o preço anual preenchido', () => {
  assert.equal(anualDisponivelXgestao({ valorAnual: '990.00' }, false), false);
  assert.equal(anualDisponivelXgestao({ valorAnual: null }, true), false);
  assert.equal(anualDisponivelXgestao({ valorAnual: '0' }, true), false);
  assert.equal(anualDisponivelXgestao({ valorAnual: '990.00' }, true), true);
});

test('cancelamento agendado e assinar de novo: 1ª cobrança no fim do período pago, nunca antes nem depois', () => {
  const fimPago = dias(20);
  const r = primeiraCobrancaAoAssinar({ acessoAte: fimPago, bonusJaUsado: true }, agora);
  assert.equal(r.primeiraCobrancaEm?.getTime(), fimPago.getTime());
  assert.equal(r.comBonus, false);
  // Período já acabou: cobra agora.
  assert.equal(primeiraCobrancaAoAssinar({ acessoAte: dias(-1), bonusJaUsado: true }, agora).primeiraCobrancaEm, null);
  // No teste com bônus já usado (conta ou documento): 1ª cobrança no fim do teste, sem mês extra.
  const fimTeste = dias(30);
  assert.equal(primeiraCobrancaAoAssinar({ fimTeste, bonusJaUsado: true }, agora).primeiraCobrancaEm?.getTime(), fimTeste.getTime());
  assert.equal(primeiraCobrancaAoAssinar({ fimTeste, bonusJaUsado: false }, agora).primeiraCobrancaEm?.getTime(), somarMeses(fimTeste, 1).getTime());
});

test('retorno: cada saída seguida de nova assinatura paga é uma volta; 2 em 90 dias acendem o alerta', () => {
  const pagas = [dias(-100), dias(-50), dias(-10)];
  const saidas = [dias(-60), dias(-20)];
  const r = retornoDoAssinante({ assinaturasPagas: pagas, saidas, tentativasBloqueadas: 0 }, agora);
  assert.equal(r.voltou, true);
  assert.equal(r.ciclosTotal, 2);
  assert.equal(r.ciclos90d, 2);
  assert.equal(r.voltouEm, dias(-10).toISOString());
  assert.equal(r.frequente, true);
  assert.equal(CICLOS_PARA_ALERTA, 2);
  assert.equal(JANELA_CICLOS_DIAS, 90);
});

test('retorno: voltas antigas não acendem o alerta; várias saídas antes da mesma volta contam uma vez', () => {
  const r = retornoDoAssinante({
    assinaturasPagas: [dias(-400), dias(-300), dias(-200)],
    saidas: [dias(-350), dias(-340), dias(-250)],
    tentativasBloqueadas: 0,
  }, agora);
  assert.equal(r.ciclosTotal, 2);
  assert.equal(r.ciclos90d, 0);
  assert.equal(r.frequente, false);
});

test('retorno: cancelou e não voltou não é volta; tentativa bloqueada de 2º teste/bônus acende o alerta', () => {
  const semVolta = retornoDoAssinante({ assinaturasPagas: [dias(-40)], saidas: [dias(-5)], tentativasBloqueadas: 0 }, agora);
  assert.equal(semVolta.voltou, false);
  assert.equal(semVolta.frequente, false);
  const bloqueado = retornoDoAssinante({ assinaturasPagas: [], saidas: [], tentativasBloqueadas: 1 }, agora);
  assert.equal(bloqueado.voltou, false);
  assert.equal(bloqueado.frequente, true);
});

test('segmentos: "voltou" e "cancela_volta" vêm da URL e filtram a mesma regra da tela e do CSV', () => {
  assert.equal(filtroSegmentoDaUrl('voltou'), 'voltou');
  assert.equal(filtroSegmentoDaUrl('cancela_volta'), 'cancela_volta');
  const base = {
    empreiteiraNome: 'E', nome: 'N', email: 'e@x.test', semEmpresa: false,
    situacao: { codigo: 'pago', rotulo: 'Pago', motivo: null, ate: null, diasRestantes: 10, diasEmAtraso: null },
    atencao: [],
    engajamento: { nivel: 'ativo', ultimoSinalEm: null, ultimoRegistroEm: null, registros30d: 0, diasSemUso: null },
  } as unknown as Parameters<typeof aplicarSegmento>[0][number];
  const linhas = [
    { ...base, email: 'a@x.test', retorno: { voltou: true, frequente: false } },
    { ...base, email: 'b@x.test', retorno: { voltou: true, frequente: true } },
    { ...base, email: 'c@x.test', retorno: { voltou: false, frequente: false } },
  ];
  assert.deepEqual(aplicarSegmento(linhas, { situacao: 'voltou' }).map((l) => l.email), ['a@x.test', 'b@x.test']);
  assert.deepEqual(aplicarSegmento(linhas, { situacao: 'cancela_volta' }).map((l) => l.email), ['b@x.test']);
});

test('bootstrap essencial cria as colunas da 0015 (documento e conta do evento) de forma idempotente', () => {
  const sql = PASSOS_ESSENCIAIS.map((p) => p.sql).join('\n');
  assert.match(sql, /ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS documento_fiscal TEXT/);
  assert.match(sql, /ALTER TABLE assinatura_eventos ADD COLUMN IF NOT EXISTS user_id VARCHAR/);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_assinaturas_documento_fiscal/);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_assinatura_eventos_user_tipo/);
});
