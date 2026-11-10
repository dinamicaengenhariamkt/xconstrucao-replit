import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  motivosAtencao,
  resumirAssinaturas,
  situacaoAssinante,
  usoRecurso,
  aguardandoPrimeiroPagamento,
  type UsoPlanoAdmin,
} from '@features/xgestao/admin/lib/situacao-assinante';
import { calcularReceitaPorPlano, calcularCancelamentos, type AssinaturaHistorica } from '@features/xgestao/admin/lib/metricas-comerciais';
import { semUsoComRisco, engajamentoAssinante } from '@features/xgestao/admin/lib/engajamento';
import {
  formatarDocumento,
  formatarTelefone,
  linkEmail,
  linkWhatsapp,
  telefoneNacional,
  validarRegistroContato,
} from '@features/xgestao/admin/lib/contato-assinante';
import {
  aplicarSegmento,
  casaJanela,
  filtrosDaUrl,
  filtrosParaQuery,
  type LinhaSegmentavel,
} from '@features/xgestao/admin/lib/segmentos-assinante';
import {
  normalizarMotivoCancelamento,
  resumirMotivosCancelamento,
  rotuloMotivoCancelamento,
  MOTIVO_CANCELAMENTO_TEXTO_MAX,
} from '@features/xgestao/lib/motivo-cancelamento';
import { classificarEstorno, inicioDoPeriodo, periodoDaUrl } from '@features/xgestao/admin/lib/estornos';
import { montarCsv } from '@features/xgestao/admin/server/csv';

const DIA = 24 * 60 * 60 * 1000;
const AGORA = new Date('2026-11-10T15:00:00.000Z');
const em = (dias: number) => new Date(AGORA.getTime() + dias * DIA);

const paga = (extra: Record<string, unknown> = {}) => ({
  status: 'ativa', provider: 'asaas', renovaEm: em(20), preco: '179.00', canceladaEm: null, ...extra,
}) as Parameters<typeof situacaoAssinante>[0] & object;

const usoLivre: UsoPlanoAdmin = {
  obras: usoRecurso(0, 3, false),
  pessoas: usoRecurso(1, 5, false),
  links: usoRecurso(0, 3, false),
};

describe('CRM-04 assinou no teste, aguardando 1º pagamento', () => {
  it('bônus do teste sem 1º pagamento e 1ª cobrança futura', () => {
    const s = situacaoAssinante(paga({ fimTesteEm: em(-3), primeiroPagamentoEm: null, renovaEm: em(27) }), AGORA);
    assert.equal(s.codigo, 'aguardando_pagamento');
    assert.equal(s.rotulo, 'Assinou no teste, aguardando 1º pagamento');
    assert.equal(s.diasRestantes, 27);
    assert.equal(s.ate, em(27).toISOString());
  });
  it('com o 1º pagamento volta a ser "Assinatura paga"', () => {
    assert.equal(situacaoAssinante(paga({ fimTesteEm: em(-3), primeiroPagamentoEm: em(-1) }), AGORA).codigo, 'pago');
  });
  it('legado sem a coluna preenchida só vira "aguardando" se o caixa não tem pagamento', () => {
    assert.equal(situacaoAssinante(paga({ primeiroPagamentoEm: null }), AGORA).codigo, 'pago');
    assert.equal(situacaoAssinante(paga({ primeiroPagamentoEm: null }), AGORA, { jaPagou: true }).codigo, 'pago');
    assert.equal(situacaoAssinante(paga({ primeiroPagamentoEm: null }), AGORA, { jaPagou: false }).codigo, 'aguardando_pagamento');
  });
  it('cobrança vencida, cancelamento agendado e teste não são "aguardando"', () => {
    assert.equal(aguardandoPrimeiroPagamento(paga({ fimTesteEm: em(-40), renovaEm: em(-1) }), AGORA), false);
    assert.equal(situacaoAssinante(paga({ fimTesteEm: em(-3), canceladaEm: em(-1) }), AGORA).codigo, 'cancelamento_agendado');
    assert.equal(aguardandoPrimeiroPagamento({ status: 'ativa', provider: 'trial', renovaEm: em(3), preco: '99', fimTesteEm: em(3) }, AGORA), false);
  });
  it('não entra no recorrente pago e aparece à parte', () => {
    const receita = calcularReceitaPorPlano([
      { situacao: { codigo: 'aguardando_pagamento' }, plano: { tier: 'basic', valorMensal: 99 } },
      { situacao: { codigo: 'pago' }, plano: { tier: 'basic', valorMensal: 99 } },
    ]);
    assert.equal(receita.mrr, 99);
    assert.equal(receita.pagantes, 1);
    assert.equal(receita.aguardandoPrimeiroPagamento, 1);
    assert.equal(receita.mrrAguardando, 99);
  });
  it('1ª cobrança em até 7 dias pede atenção (info); sem uso conta como risco', () => {
    const s = situacaoAssinante(paga({ fimTesteEm: em(-25), renovaEm: em(5) }), AGORA);
    const m = motivosAtencao(s, usoLivre, 0);
    assert.deepEqual(m.map((x) => [x.codigo, x.severidade, x.texto]), [['primeira_cobranca', 'info', '1ª cobrança em 5 dias']]);
    assert.equal(semUsoComRisco('aguardando_pagamento', engajamentoAssinante({ usoTitular: null, usoEquipe: null, registro: null, registros30d: 0 }, AGORA)), true);
  });
});

describe('CRM-12 dias em atraso do inadimplente', () => {
  it('conta os dias desde o vencimento e mostra no motivo', () => {
    const s = situacaoAssinante(paga({ status: 'inadimplente', renovaEm: em(-3) }), AGORA);
    assert.equal(s.codigo, 'inadimplente');
    assert.equal(s.diasEmAtraso, 3);
    assert.equal(s.diasRestantes, 4);
    assert.equal(motivosAtencao(s, usoLivre, 0)[0].texto, '3 dias em atraso; carência termina em 4 dias');
  });
  it('outras situações não têm atraso', () => {
    assert.equal(situacaoAssinante(paga(), AGORA).diasEmAtraso, null);
  });
});

describe('CRM-06 resumo: teste acabando em 7 dias', () => {
  it('conta só quem está em teste com até 7 dias', () => {
    const trial = (d: number) => situacaoAssinante({ status: 'ativa', provider: 'trial', renovaEm: em(d), preco: '99', canceladaEm: null }, AGORA);
    const r = resumirAssinaturas([trial(2), trial(7), trial(8)].map((situacao) => ({ situacao, atencao: [] })));
    assert.equal(r.testeAcabando7d, 2);
    assert.equal(r.porSituacao.aguardando_pagamento, 0);
  });
});

describe('CRM-01 contato', () => {
  it('telefone brasileiro com ou sem máscara, +55 e 0', () => {
    assert.equal(telefoneNacional('(11) 91234-5678'), '11912345678');
    assert.equal(telefoneNacional('+55 11 91234-5678'), '11912345678');
    assert.equal(telefoneNacional('011 3456-7890'), '1134567890');
    assert.equal(telefoneNacional('1234'), null);
    assert.equal(telefoneNacional('11 81234-5678'), null, 'celular de 11 dígitos começa com 9');
    assert.equal(telefoneNacional(null), null);
  });
  it('link do WhatsApp só com telefone válido', () => {
    assert.equal(linkWhatsapp('(21) 99876-5432'), 'https://wa.me/5521998765432');
    assert.equal(linkWhatsapp('sem telefone'), null);
  });
  it('mailto só para e-mail válido', () => {
    assert.equal(linkEmail(' a@b.com '), 'mailto:a@b.com');
    assert.equal(linkEmail('a@b'), null);
  });
  it('máscaras de telefone e documento', () => {
    assert.equal(formatarTelefone('11912345678'), '(11) 91234-5678');
    assert.equal(formatarTelefone('1134567890'), '(11) 3456-7890');
    assert.equal(formatarDocumento('12345678901'), '123.456.789-01');
    assert.equal(formatarDocumento('12345678000199'), '12.345.678/0001-99');
    assert.equal(formatarDocumento('abc'), 'abc');
  });
  it('telefone no CSV não vira fórmula', () => {
    assert.ok(montarCsv(['Telefone'], [['+55 11 91234-5678']]).includes("'+55"));
  });
});

describe('CRM-07 registro de contato', () => {
  it('aceita canal da lista e nota opcional até 1000 caracteres', () => {
    assert.deepEqual(validarRegistroContato({ canal: 'whatsapp', nota: '  ligou  ' }), { ok: true, canal: 'whatsapp', nota: 'ligou' });
    assert.deepEqual(validarRegistroContato({ canal: 'email' }), { ok: true, canal: 'email', nota: null });
    assert.equal(validarRegistroContato({ canal: 'sms' }).ok, false);
    assert.equal(validarRegistroContato({ canal: 'outro', nota: 'x'.repeat(1001) }).ok, false);
    assert.equal(validarRegistroContato(null).ok, false);
  });
});

describe('CRM-03 motivo do cancelamento', () => {
  it('opcional, lista fechada e texto até 500', () => {
    assert.deepEqual(normalizarMotivoCancelamento(undefined, undefined), { ok: true, motivo: null, texto: null });
    assert.deepEqual(normalizarMotivoCancelamento('preco_alto', '  caro  '), { ok: true, motivo: 'preco_alto', texto: 'caro' });
    assert.equal(normalizarMotivoCancelamento('qualquer', null).ok, false);
    assert.equal(normalizarMotivoCancelamento(null, 'x'.repeat(MOTIVO_CANCELAMENTO_TEXTO_MAX + 1)).ok, false);
    assert.equal(normalizarMotivoCancelamento(null, 123).ok, false);
  });
  it('rótulos e resumo por motivo, com "Não informou" no fim', () => {
    assert.equal(rotuloMotivoCancelamento('obras_acabaram'), 'Minhas obras acabaram');
    assert.equal(rotuloMotivoCancelamento(null), 'Não informou');
    const r = resumirMotivosCancelamento(['usei_pouco', null, 'preco_alto', 'usei_pouco']);
    assert.equal(r.total, 4);
    assert.deepEqual(r.porMotivo.map((m) => [m.motivo, m.quantidade]), [['preco_alto', 1], ['usei_pouco', 2], ['sem_resposta', 1]]);
  });
  it('a saída da conversão leva o motivo da assinatura', () => {
    const a: AssinaturaHistorica = {
      id: 'a1', userId: 'u1', status: 'ativa', provider: 'asaas', tier: 'basic', plano: 'Basic', preco: '99',
      createdAt: em(-40), renovaEm: em(10), canceladaEm: em(-1), motivoCancelamento: 'preco_alto', motivoCancelamentoTexto: 'caro',
    };
    const c = calcularCancelamentos(new Map([['u1', [a]]]), 1, AGORA);
    assert.deepEqual([c.saidas[0].tipo, c.saidas[0].motivo, c.saidas[0].motivoTexto], ['agendado', 'preco_alto', 'caro']);
  });
});

describe('CRM-11 estorno x chargeback', () => {
  it('classifica pelo id do evento do gateway', () => {
    assert.equal(classificarEstorno(['PAYMENT_REFUNDED:pay_1']), 'estorno');
    assert.equal(classificarEstorno(['PAYMENT_REFUND_IN_PROGRESS:pay_1', 'PAYMENT_CHARGEBACK_REQUESTED:pay_1']), 'chargeback');
    assert.equal(classificarEstorno(['PAYMENT_AWAITING_CHARGEBACK_REVERSAL:pay_1']), 'chargeback');
    assert.equal(classificarEstorno(['xg45-estorno-1']), 'estorno');
    assert.equal(classificarEstorno([]), 'estorno');
    // `payload_json.motivo` (gravado pelo webhook) manda; o prefixo só cobre evento antigo.
    assert.equal(classificarEstorno(['evt_neutro:pay_1'], ['chargeback']), 'chargeback');
    assert.equal(classificarEstorno(['evt_neutro:pay_1'], ['estorno', null]), 'estorno');
    assert.equal(classificarEstorno(['PAYMENT_CHARGEBACK_REQUESTED:pay_1'], [null]), 'chargeback');
  });
  it('períodos: mês atual (SP), 30 e 90 dias', () => {
    assert.equal(periodoDaUrl('90d'), '90d');
    assert.equal(periodoDaUrl('x'), 'mes');
    assert.equal(inicioDoPeriodo('mes', AGORA).toISOString(), '2026-11-01T03:00:00.000Z');
    assert.equal(inicioDoPeriodo('30d', AGORA).toISOString(), em(-30).toISOString());
  });
});

function linha(extra: Partial<LinhaSegmentavel> & { situacao: LinhaSegmentavel['situacao'] }): LinhaSegmentavel & { id: string } {
  return {
    id: Math.random().toString(36).slice(2),
    empreiteiraNome: 'Empresa', nome: 'Fulano', email: 'f@x.com', semEmpresa: false, atencao: [],
    engajamento: engajamentoAssinante({ usoTitular: em(-1), usoEquipe: null, registro: em(-1), registros30d: 1 }, AGORA),
    contato: { telefone: '(11) 91234-5678', documento: '12.345.678/0001-99', cidade: 'Campinas' },
    saida: null, trocas: { descidaAgendada: null, subidaRecente: null }, ultimoContato: null,
    ...extra,
  };
}
const trial = (d: number) => situacaoAssinante({ status: 'ativa', provider: 'trial', renovaEm: em(d), preco: '99', canceladaEm: null }, AGORA);

describe('CRM-02/06 recortes da lista e do CSV', () => {
  it('janelas do teste e da renovação', () => {
    assert.equal(casaJanela(linha({ situacao: trial(3) }), 'teste_3d'), true);
    assert.equal(casaJanela(linha({ situacao: trial(4) }), 'teste_3d'), false);
    assert.equal(casaJanela(linha({ situacao: trial(1) }), 'teste_1d'), true);
    assert.equal(casaJanela(linha({ situacao: situacaoAssinante(paga({ renovaEm: em(6) }), AGORA) }), 'renova_7d'), true);
    assert.equal(casaJanela(linha({ situacao: situacaoAssinante(paga({ renovaEm: em(6), fimTesteEm: em(-24) }), AGORA) }), 'renova_7d'), true);
    assert.equal(casaJanela(linha({ situacao: situacaoAssinante(paga({ renovaEm: em(9) }), AGORA) }), 'renova_7d'), false);
  });
  it('nunca usou no teste = em teste sem nenhum registro nas obras', () => {
    const semRegistro = engajamentoAssinante({ usoTitular: em(-1), usoEquipe: null, registro: null, registros30d: 0 }, AGORA);
    assert.equal(casaJanela(linha({ situacao: trial(5), engajamento: semRegistro }), 'nunca_usou_teste'), true);
    assert.equal(casaJanela(linha({ situacao: trial(5) }), 'nunca_usou_teste'), false);
  });
  it('segmentos, nunca contatado e busca por telefone/cidade', () => {
    const saiu = linha({ situacao: situacaoAssinante(null, AGORA), saida: { em: em(-2).toISOString(), motivo: 'x' } });
    const contatado = linha({ situacao: trial(5), ultimoContato: { em: em(-1).toISOString() } });
    const descida = linha({ situacao: trial(9), trocas: { descidaAgendada: { em: '', plano: 'Basic' }, subidaRecente: null } });
    const base = [saiu, contatado, descida];
    assert.deepEqual(aplicarSegmento(base, { situacao: 'saiu' }), [saiu]);
    assert.deepEqual(aplicarSegmento(base, { situacao: 'descida_agendada' }), [descida]);
    assert.deepEqual(aplicarSegmento(base, { nuncaContatado: true }), [saiu, descida]);
    assert.equal(aplicarSegmento(base, { busca: '91234' }).length, 3);
    assert.equal(aplicarSegmento(base, { busca: 'campinas' }).length, 3);
    assert.equal(aplicarSegmento(base, { busca: 'inexistente' }).length, 0);
  });
  it('ordena por urgência, dias sem uso e atraso', () => {
    const a = linha({ situacao: trial(9) });
    const b = linha({ situacao: trial(2) });
    const c = linha({ situacao: situacaoAssinante(null, AGORA) });
    assert.deepEqual(aplicarSegmento([a, c, b], { ordem: 'urgencia' }), [b, a, c]);
    const atraso5 = linha({ situacao: situacaoAssinante(paga({ status: 'inadimplente', renovaEm: em(-5) }), AGORA) });
    const atraso1 = linha({ situacao: situacaoAssinante(paga({ status: 'inadimplente', renovaEm: em(-1) }), AGORA) });
    assert.deepEqual(aplicarSegmento([atraso1, a, atraso5], { ordem: 'atraso' }), [atraso5, atraso1, a]);
    const nunca = linha({ situacao: trial(5), engajamento: engajamentoAssinante({ usoTitular: null, usoEquipe: null, registro: null, registros30d: 0 }, AGORA) });
    assert.deepEqual(aplicarSegmento([a, nunca], { ordem: 'sem_uso' })[0], nunca);
  });
  it('URL e CSV usam a mesma leitura dos filtros', () => {
    const f = filtrosDaUrl(new URLSearchParams('situacao=aguardando_pagamento&janela=renova_7d&ordem=urgencia&contato=nunca&q=ana'));
    assert.deepEqual(f, { situacao: 'aguardando_pagamento', janela: 'renova_7d', ordem: 'urgencia', nuncaContatado: true, busca: 'ana' });
    assert.equal(filtrosParaQuery(f), 'situacao=aguardando_pagamento&janela=renova_7d&ordem=urgencia&contato=nunca&q=ana');
    assert.deepEqual(filtrosDaUrl(new URLSearchParams('situacao=hack&janela=x&ordem=y')), { situacao: '', janela: '', ordem: '', nuncaContatado: false, busca: '' });
  });
});

describe('CRM estrutura das telas', () => {
  const ler = (p: string) => readFileSync(p, 'utf8');
  it('o botão de exportar envia o recorte ativo e o CSV aplica a mesma função', () => {
    assert.match(ler('app/admin/xgestao/assinantes/page.tsx'), /export\?tipo=assinantes\$\{queryExportacao/);
    const rota = ler('app/api/admin/xgestao/export/route.ts');
    assert.match(rota, /aplicarSegmento\(await listarAssinantesDetalhados\(\)/);
    assert.match(rota, /'Telefone', 'CPF\/CNPJ', 'Cidade', 'UF'/);
    assert.match(rota, /'Motivo do cancelamento'/);
    assert.match(rota, /'Último contato'/);
    assert.doesNotMatch(rota, /Consentimento de marketing/);
  });
  it('contatos: rota só para admin, com audit_logs', () => {
    const rota = ler('app/api/admin/xgestao/assinantes/[id]/contatos/route.ts');
    assert.match(rota, /requireAdminXgestao/);
    assert.match(ler('features/xgestao/admin/server/contatos.ts'), /recordAudit/);
  });
  it('cancelar com gateway desligado responde 503, não 500', () => {
    const rota = ler('app/api/assinaturas/cancelar/route.ts');
    assert.match(rota, /ehGatewayNaoConfigurado\(err\)/);
    assert.match(rota, /code: "GATEWAY_NAO_CONFIGURADO", message: MENSAGEM_PAGAMENTOS_INDISPONIVEIS \}, \{ status: 503 \}/);
  });
  it('webhook grava o motivo do estorno no evento', () => {
    assert.match(ler('features/planos/assinatura-service.ts'), /motivo: evt\.motivo \?\? null/);
  });
  it('trocas do admin só leem status explícitos (pendente_gateway e falhou ficam fora)', () => {
    const server = ler('features/xgestao/admin/server/assinantes.ts');
    assert.equal((server.match(/eq\(assinaturaTrocas\.status, 'agendada'\)/g) ?? []).length, 2);
    assert.doesNotMatch(server, /ne\(assinaturaTrocas\.status|notInArray\(assinaturaTrocas\.status/);
  });
  it('WhatsApp abre em nova aba', () => {
    assert.match(ler('features/xgestao/admin/components/AssinanteIndicadores.tsx'), /target="_blank" rel="noopener noreferrer"/);
  });
  it('diálogo de cancelar tem o motivo opcional', () => {
    const tela = ler('features/xgestao/components/XGestaoPlanosSection.tsx');
    assert.match(tela, /cancelar-motivo/);
    assert.match(tela, /MOTIVOS_CANCELAMENTO\.map/);
  });
  it('home tem os atalhos dos segmentos urgentes', () => {
    const home = ler('app/admin/xgestao/page.tsx');
    for (const href of ['janela=teste_7d', 'situacao=aguardando_pagamento', 'situacao=inadimplente', 'situacao=cancelamento_agendado']) {
      assert.ok(home.includes(href), href);
    }
  });
});
