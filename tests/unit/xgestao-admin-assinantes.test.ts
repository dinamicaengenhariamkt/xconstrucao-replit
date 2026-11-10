import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  compararAtencao,
  DIAS_TESTE_ACABANDO,
  escolherAssinaturaCanonica,
  isCodigoSituacaoAssinante,
  LIMITE_LINKS_LEGADO,
  limitesDoTier,
  motivosAtencao,
  resumirAssinaturas,
  rotuloEventoAssinatura,
  rotuloStatusAssinatura,
  severidadeMaxima,
  situacaoAssinante,
  SITUACOES_ASSINANTE,
  usoRecurso,
  type UsoPlanoAdmin,
} from '@features/xgestao/admin/lib/situacao-assinante';
import { OFERTA_XGESTAO } from '@features/xgestao/lib/oferta-comercial';

const DIA = 24 * 60 * 60 * 1000;
const AGORA = new Date('2026-11-10T15:00:00.000Z');
const em = (dias: number) => new Date(AGORA.getTime() + dias * DIA);

const trial = (renovaEm: Date | null, status = 'ativa') => ({ status, provider: 'trial', renovaEm, preco: '99.00', canceladaEm: null });
const paga = (extra: Partial<{ status: string; renovaEm: Date | null; canceladaEm: Date | null; preco: string }> = {}) => ({
  status: 'ativa', provider: 'asaas', renovaEm: em(20), preco: '179.00', canceladaEm: null, ...extra,
});

const usoLivre: UsoPlanoAdmin = {
  obras: usoRecurso(0, 3, false),
  pessoas: usoRecurso(1, 5, false),
  links: usoRecurso(0, 3, false),
};

describe('XG44 situação do assinante no admin', () => {
  it('sem nenhuma assinatura = teste não iniciado', () => {
    const s = situacaoAssinante(null, AGORA);
    assert.equal(s.codigo, 'sem_teste');
    assert.equal(s.ate, null);
    assert.equal(s.motivo, null);
  });

  it('teste dentro do prazo mostra o fim e os dias restantes arredondados para cima', () => {
    const fim = new Date(AGORA.getTime() + 4 * DIA + 60_000);
    const s = situacaoAssinante(trial(fim), AGORA);
    assert.equal(s.codigo, 'em_teste');
    assert.equal(s.ate, fim.toISOString());
    assert.equal(s.diasRestantes, 5);
  });

  it('teste vencido há menos de 24h está na tolerância, com o momento do bloqueio', () => {
    const fim = new Date(AGORA.getTime() - 2 * 60 * 60 * 1000);
    const s = situacaoAssinante(trial(fim), AGORA);
    assert.equal(s.codigo, 'teste_tolerancia');
    assert.equal(s.ate, new Date(fim.getTime() + DIA).toISOString());
    assert.equal(s.diasRestantes, 1);
  });

  it('teste vencido há mais de 24h é somente leitura com o motivo do teste', () => {
    const s = situacaoAssinante(trial(em(-2)), AGORA);
    assert.equal(s.codigo, 'somente_leitura');
    assert.equal(s.motivo, 'Teste grátis encerrado sem assinatura');
    // Expirado pelo job (`status = expirada`) dá o mesmo resultado.
    assert.equal(situacaoAssinante(trial(em(-2), 'expirada'), AGORA).motivo, 'Teste grátis encerrado sem assinatura');
  });

  it('assinatura paga ativa mostra a próxima cobrança', () => {
    const s = situacaoAssinante(paga(), AGORA);
    assert.equal(s.codigo, 'pago');
    assert.equal(s.ate, em(20).toISOString());
    assert.equal(s.diasRestantes, 20);
  });

  it('cancelamento agendado mantém o acesso até o fim do período pago', () => {
    const s = situacaoAssinante(paga({ canceladaEm: em(-1), renovaEm: em(9) }), AGORA);
    assert.equal(s.codigo, 'cancelamento_agendado');
    assert.equal(s.ate, em(9).toISOString());
  });

  it('cancelamento agendado vencido é somente leitura "Assinatura cancelada"', () => {
    const s = situacaoAssinante(paga({ canceladaEm: em(-40), renovaEm: em(-1) }), AGORA);
    assert.equal(s.codigo, 'somente_leitura');
    assert.equal(s.motivo, 'Assinatura cancelada');
  });

  it('inadimplente tem carência de 7 dias contada do vencimento', () => {
    const s = situacaoAssinante(paga({ status: 'inadimplente', renovaEm: em(-2) }), AGORA);
    assert.equal(s.codigo, 'inadimplente');
    assert.equal(s.ate, em(5).toISOString());
    assert.equal(s.diasRestantes, 5);
    const esgotada = situacaoAssinante(paga({ status: 'inadimplente', renovaEm: em(-8) }), AGORA);
    assert.equal(esgotada.codigo, 'somente_leitura');
    assert.equal(esgotada.motivo, 'Pagamento não regularizado na carência');
  });

  it('plano sem preço (free legado) não é pago: somente leitura', () => {
    const s = situacaoAssinante(paga({ preco: '0' }), AGORA);
    assert.equal(s.codigo, 'somente_leitura');
    assert.equal(s.motivo, 'Sem plano pago');
  });

  it('cada código tem rótulo e é reconhecido pelo guarda de tipo', () => {
    for (const codigo of SITUACOES_ASSINANTE) assert.ok(isCodigoSituacaoAssinante(codigo));
    assert.equal(isCodigoSituacaoAssinante('qualquer'), false);
    assert.equal(isCodigoSituacaoAssinante(null), false);
  });
});

describe('XG44 escolha da assinatura canônica (mesma ordem de situacaoPlanoXgestao)', () => {
  const base = { provider: 'asaas', renovaEm: em(10), preco: '99', canceladaEm: null };
  it('ativa vence inadimplente e cancelada, mesmo mais antiga', () => {
    const linhas = [
      { ...base, id: 'c', status: 'cancelada', createdAt: em(-1) },
      { ...base, id: 'i', status: 'inadimplente', createdAt: em(-2) },
      { ...base, id: 'a', status: 'ativa', createdAt: em(-30) },
    ];
    assert.equal(escolherAssinaturaCanonica(linhas)?.id, 'a');
  });
  it('inadimplente vence as encerradas; empate pela mais recente', () => {
    assert.equal(escolherAssinaturaCanonica([
      { ...base, id: 'x', status: 'expirada', createdAt: em(-1) },
      { ...base, id: 'i', status: 'inadimplente', createdAt: em(-5) },
    ])?.id, 'i');
    assert.equal(escolherAssinaturaCanonica([
      { ...base, id: 'velha', status: 'expirada', createdAt: em(-9) },
      { ...base, id: 'nova', status: 'cancelada', createdAt: em(-1) },
    ])?.id, 'nova');
  });
  it('lista vazia = null', () => {
    assert.equal(escolherAssinaturaCanonica([]), null);
  });
  it('o critério é o mesmo do servidor (ordem no SQL de plano-empresa.ts)', () => {
    const fonte = readFileSync('features/xgestao/server/plano-empresa.ts', 'utf8');
    assert.match(fonte, /WHEN 'ativa' THEN 0 WHEN 'inadimplente' THEN 1 ELSE 2/);
    assert.match(fonte, /desc\(assinaturas\.createdAt\)/);
  });
});

describe('XG44 uso de cada limite', () => {
  it('classifica livre, perto (>=80%), no limite e acima', () => {
    assert.deepEqual(usoRecurso(1, 5, false), { usado: 1, limite: 5, nivel: 'livre', percentual: 20 });
    assert.equal(usoRecurso(4, 5, false).nivel, 'perto');
    assert.equal(usoRecurso(3, 5, false).nivel, 'livre');
    assert.equal(usoRecurso(5, 5, false).nivel, 'no_limite');
    assert.deepEqual(usoRecurso(4, 3, false), { usado: 4, limite: 3, nivel: 'acima', percentual: 133 });
    // Limite 1 (Basic): 0 de 1 é livre, 1 de 1 já é o limite.
    assert.equal(usoRecurso(0, 1, false).nivel, 'livre');
    assert.equal(usoRecurso(1, 1, false).nivel, 'no_limite');
  });
  it('sem limite: null, negativo (-1 da oferta) ou 9999 do catálogo antigo', () => {
    for (const limite of [null, undefined, -1, 9999, 100000]) {
      assert.deepEqual(usoRecurso(7, limite, false), { usado: 7, limite: null, nivel: 'sem_limite', percentual: null });
    }
  });
  it('somente leitura bloqueia, qualquer que seja o limite', () => {
    assert.deepEqual(usoRecurso(2, 10, true), { usado: 2, limite: 0, nivel: 'bloqueado', percentual: null });
  });
  it('normaliza entrada inválida para zero', () => {
    assert.equal(usoRecurso(Number.NaN, 3, false).usado, 0);
    assert.equal(usoRecurso(-2, 3, false).usado, 0);
  });
});

describe('XG44 limites por tier', () => {
  it('oferta nova vem do catálogo, com Premium sem limite de links', () => {
    for (const tier of ['basic', 'basic_plus', 'premium'] as const) {
      const limites = limitesDoTier(tier);
      assert.equal(limites.obras, OFERTA_XGESTAO[tier].obrasAtivas);
      assert.equal(limites.pessoas, OFERTA_XGESTAO[tier].pessoasEmpresa);
    }
    assert.equal(limitesDoTier('basic').linksPorObra, 1);
    assert.equal(limitesDoTier('basic_plus').linksPorObra, 3);
    assert.equal(usoRecurso(9, limitesDoTier('premium').linksPorObra, false).nivel, 'sem_limite');
  });
  it('legado: sem cota de pessoas e links pelo teto técnico do token.ts', () => {
    const limites = limitesDoTier('pro');
    assert.equal(limites.pessoas, null);
    assert.equal(limites.linksPorObra, LIMITE_LINKS_LEGADO);
    const token = readFileSync('features/xgestao/obra-publica/server/token.ts', 'utf8');
    assert.match(token, new RegExp(`LIMITE_LINKS_ATIVOS = ${LIMITE_LINKS_LEGADO};`));
  });
  it('sem plano vigente: tudo zero', () => {
    assert.deepEqual(limitesDoTier(null), { obras: 0, pessoas: 0, linksPorObra: 0 });
  });
});

describe('XG44 motivos de atenção', () => {
  it('nada a fazer para pago com folga', () => {
    assert.deepEqual(motivosAtencao(situacaoAssinante(paga(), AGORA), usoLivre, 2), []);
  });
  it('teste acabando só entra a partir de 7 dias', () => {
    const longe = situacaoAssinante(trial(em(DIAS_TESTE_ACABANDO + 1)), AGORA);
    assert.deepEqual(motivosAtencao(longe, usoLivre, 0), []);
    const perto = situacaoAssinante(trial(em(3)), AGORA);
    assert.deepEqual(motivosAtencao(perto, usoLivre, 0).map((m) => [m.codigo, m.texto]), [['teste_acabando', 'Teste grátis termina em 3 dias']]);
    const hoje = situacaoAssinante(trial(new Date(AGORA.getTime() + 60_000)), AGORA);
    assert.equal(motivosAtencao(hoje, usoLivre, 0)[0].texto, 'Teste grátis termina em 1 dia');
  });
  it('inadimplente e acima do limite são críticos e vêm antes dos informativos', () => {
    const uso: UsoPlanoAdmin = { obras: usoRecurso(4, 3, false), pessoas: usoRecurso(4, 5, false), links: usoRecurso(1, 1, false) };
    const motivos = motivosAtencao(situacaoAssinante(paga({ status: 'inadimplente', renovaEm: em(-1) }), AGORA), uso, 4);
    assert.deepEqual(motivos.map((m) => m.codigo), ['inadimplente', 'acima_do_limite', 'perto_do_limite', 'no_limite']);
    assert.equal(motivos[1].texto, 'Acima do limite de obras (4 de 3)');
    assert.equal(severidadeMaxima(motivos), 'critica');
  });
  it('somente leitura só pede atenção quando há obras (remarketing)', () => {
    const s = situacaoAssinante(trial(em(-5)), AGORA);
    const bloqueado: UsoPlanoAdmin = { obras: usoRecurso(1, 0, true), pessoas: usoRecurso(1, 0, true), links: usoRecurso(0, 0, true) };
    assert.deepEqual(motivosAtencao(s, bloqueado, 0), []);
    assert.deepEqual(motivosAtencao(s, bloqueado, 2).map((m) => m.texto), ['Somente leitura com 2 obras cadastradas']);
  });
  it('tolerância e cancelamento agendado entram com prazo', () => {
    const tol = motivosAtencao(situacaoAssinante(trial(em(-0.5)), AGORA), usoLivre, 0);
    assert.equal(tol[0].codigo, 'teste_tolerancia');
    assert.equal(tol[0].severidade, 'critica');
    const canc = motivosAtencao(situacaoAssinante(paga({ canceladaEm: em(-1), renovaEm: em(1) }), AGORA), usoLivre, 0);
    assert.deepEqual(canc.map((m) => m.texto), ['Cancelou; acesso termina em 1 dia']);
  });
  it('ordena assinantes por severidade e depois pela quantidade de motivos', () => {
    const critico = [{ codigo: 'inadimplente', severidade: 'critica', texto: '' }] as const;
    const doisInfo = [
      { codigo: 'no_limite', severidade: 'info', texto: '' },
      { codigo: 'perto_do_limite', severidade: 'info', texto: '' },
    ] as const;
    const umInfo = [{ codigo: 'no_limite', severidade: 'info', texto: '' }] as const;
    const lista = [umInfo, critico, [], doisInfo].sort(compararAtencao);
    assert.deepEqual(lista, [critico, doisInfo, umInfo, []]);
  });
});

describe('XG44 resumo das assinaturas', () => {
  it('conta cada situação, quem pede atenção, críticos e limites', () => {
    const linhas = [
      { situacao: situacaoAssinante(trial(em(30)), AGORA), atencao: [] },
      { situacao: situacaoAssinante(trial(em(2)), AGORA), atencao: motivosAtencao(situacaoAssinante(trial(em(2)), AGORA), usoLivre, 0) },
      { situacao: situacaoAssinante(paga(), AGORA), atencao: motivosAtencao(situacaoAssinante(paga(), AGORA), { ...usoLivre, obras: usoRecurso(3, 3, false) }, 3) },
      { situacao: situacaoAssinante(paga({ status: 'inadimplente', renovaEm: em(-1) }), AGORA), atencao: motivosAtencao(situacaoAssinante(paga({ status: 'inadimplente', renovaEm: em(-1) }), AGORA), usoLivre, 1) },
      { situacao: situacaoAssinante(null, AGORA), atencao: [] },
    ];
    const resumo = resumirAssinaturas(linhas);
    assert.equal(resumo.total, 5);
    assert.deepEqual(resumo.porSituacao, {
      em_teste: 2, teste_tolerancia: 0, aguardando_pagamento: 0, pago: 1, cancelamento_agendado: 0, inadimplente: 1, somente_leitura: 0, sem_teste: 1,
    });
    assert.equal(resumo.precisamAtencao, 3);
    assert.equal(resumo.criticos, 1);
    assert.equal(resumo.pertoOuNoLimite, 1);
  });
});

describe('XG44 rótulos do histórico', () => {
  it('traduz os eventos gravados e mostra o tipo cru quando desconhecido', () => {
    assert.equal(rotuloEventoAssinatura('teste_iniciado'), 'Teste grátis iniciado');
    assert.equal(rotuloEventoAssinatura('cancelamento_agendado'), 'Cancelamento agendado pelo assinante');
    assert.equal(rotuloEventoAssinatura('payment_succeeded'), 'Pagamento confirmado');
    assert.equal(rotuloEventoAssinatura('evento_novo'), 'evento_novo');
    assert.equal(rotuloStatusAssinatura('expirada'), 'Expirada');
    assert.equal(rotuloStatusAssinatura('outro'), 'outro');
  });
});

describe('XG44 estrutura das páginas (macro na home, micro nas páginas próprias)', () => {
  const home = readFileSync('app/admin/xgestao/page.tsx', 'utf8');
  const lista = readFileSync('app/admin/xgestao/assinantes/page.tsx', 'utf8');
  const detalhe = readFileSync('app/admin/xgestao/assinantes/[id]/page.tsx', 'utf8');
  const obra = readFileSync('app/admin/xgestao/obras/[id]/page.tsx', 'utf8');
  const rotaDetalhe = readFileSync('app/api/admin/xgestao/assinantes/[id]/route.ts', 'utf8');

  it('home não repete a lista completa de assinantes; mostra resumo e atenção com links', () => {
    assert.doesNotMatch(home, /Acessos xgestão/);
    assert.match(home, /data-testid="xgestao-assinaturas-resumo"/);
    assert.match(home, /data-testid="xgestao-assinantes-atencao"/);
    assert.match(home, /\/admin\/xgestao\/assinantes\?situacao=\$\{codigo\}/);
    assert.match(home, /\/admin\/xgestao\/assinantes\?situacao=atencao/);
    assert.match(home, /\/admin\/xgestao\/assinantes\/\$\{item\.userId\}/);
  });
  it('lista filtra pela URL e leva ao detalhe', () => {
    // CRM-06 — o recorte inteiro (situação, janela, ordem, contato) sai da URL.
    assert.match(lista, /filtrosDaUrl\(searchParams\)/);
    assert.match(lista, /\/admin\/xgestao\/assinantes\/\$\{assinante\.userId\}/);
    assert.match(lista, /Suspense/);
  });
  it('detalhe liga às obras e a obra liga de volta ao assinante', () => {
    assert.match(detalhe, /\/admin\/xgestao\/obras\/\$\{obra\.id\}/);
    assert.match(detalhe, /xgestao-assinante-nao-encontrado/);
    assert.match(obra, /\/admin\/xgestao\/assinantes\/\$\{assinante\.userId\}/);
  });
  it('rota do detalhe passa pelo guard do admin e valida o id antes do banco', () => {
    assert.match(rotaDetalhe, /requireAdminXgestao/);
    assert.ok(rotaDetalhe.indexOf('ID_VALIDO.test') < rotaDetalhe.indexOf('detalheAssinanteXgestao(id)'));
  });
});
