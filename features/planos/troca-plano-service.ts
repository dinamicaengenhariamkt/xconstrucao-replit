/**
 * XG48 — troca de plano do xgestão com assinatura paga.
 *
 * - Subir: vale na hora, sem cobrança imediata e sem digitar cartão. O valor
 *   da assinatura no gateway muda já (`updatePendingPayments`) e a diferença
 *   proporcional entra somada só na próxima fatura.
 * - Descer: agendada para a renovação (`renovaEm`); a próxima fatura já vem
 *   com o valor menor. A escolha de obras e pessoas é feita uma única vez.
 * - No mês bônus ainda não pago: só muda o plano e o valor da 1ª cobrança.
 *
 * Idempotência: chave por pedido (`chaveIdempotencia`, única por titular) e
 * lock por titular (`pg_advisory_xact_lock`). Ver docs/jornadas-xgestao/48-troca-de-plano.md.
 *
 * REV-07 — o PUT no gateway não roda dentro da transação com o lock:
 *  1. transação curta grava a troca como `pendente_gateway` e commita;
 *  2. PUT no gateway, fora de transação;
 *  3. nova transação com lock confere o estado e aplica.
 * Falha no PUT: troca `falhou`. Falha depois do PUT: `falhou` e novo PUT com o
 * valor anterior (compensação). Troca pendente esquecida (processo caiu entre
 * 2 e 3) é recuperada no próximo acesso do titular (`recuperarTrocasPendentes`).
 */
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturaTrocas, assinaturas, planos } from '@shared/db/schema';
import { ehGatewayNaoConfigurado, gatewayDaAssinatura, MENSAGEM_PAGAMENTOS_INDISPONIVEIS, type PaymentGateway } from '@features/planos/gateway';
import { encerrarCancelamentosVencidos } from '@features/planos/assinatura-service';
import { expirarTestesVencidos } from '@features/xgestao/teste/server/teste-service';
import {
  calcularProporcional,
  decidirTroca,
  MENSAGENS_BLOQUEIO,
  validarEscolha,
  valorProximaFatura,
  type DecisaoTroca,
} from '@features/xgestao/lib/troca-plano';
import { valorDoCiclo } from '@features/xgestao/lib/ciclo-plano';
import {
  aplicarMarcas,
  aplicarTrocasVencidas,
  empresaDoTitular,
  limitesTier,
  linksAtivosDaEmpresa,
  linksExcedentes,
  lockTrocaUsuario,
  membrosComVaga,
  obrasEditaveis,
  restaurarMarcas,
  sincronizarCobrancaPendente,
  trocaAgendadaDoUsuario,
} from '@features/xgestao/server/troca-marcas';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Exec = typeof db | Tx;

export type PlanoResumo = { id: string; tier: string; nome: string; valor: number };

export type PreviaTroca = {
  acao: DecisaoEfetiva['acao'];
  tipo: 'subir' | 'descer' | 'desfazer';
  planoAtual: PlanoResumo;
  planoNovo: PlanoResumo;
  /** Quando o plano novo passa a valer (subir: agora; descer: na renovação). */
  efetivaEm: string;
  proximaFaturaEm: string | null;
  diferenca: number;
  diasRestantes: number;
  diasCiclo: number;
  /** Valor da próxima fatura (plano do próximo ciclo + diferenças não pagas). */
  valorProximaFatura: number;
  /** Valor das faturas seguintes. */
  valorDepois: number;
  excedentes: {
    obras: { limite: number; emAndamento: Array<{ id: string; nome: string }>; precisaEscolher: boolean };
    membros: { limite: number; lista: Array<{ id: string; nome: string | null; email: string | null; status: string }>; precisaEscolher: boolean };
    links: { limitePorObra: number; pausados: number };
    perdeValoresPublicos: boolean;
  } | null;
};

export type ErroTroca = {
  ok: false;
  status: number;
  code: 'SEM_ASSINATURA' | 'PLANO_INVALIDO' | 'MESMO_PLANO' | 'INADIMPLENTE' | 'CANCELAMENTO_AGENDADO'
    | 'TROCA_AGENDADA' | 'ESCOLHA_INVALIDA' | 'CIENCIA_OBRIGATORIA' | 'GATEWAY_ERROR' | 'CHAVE_OBRIGATORIA'
    | 'GATEWAY_NAO_CONFIGURADO' | 'TROCA_EM_ANDAMENTO' | 'TROCA_INTERROMPIDA';
  message: string;
};

export type ResultadoTroca =
  | { ok: true; repetida: boolean; trocaId: string; status: string; previa: PreviaTroca | null }
  | ErroTroca;

function erro(code: ErroTroca['code'], message?: string, status = 409): ErroTroca {
  return { ok: false, status, code, message: message ?? (MENSAGENS_BLOQUEIO as Record<string, string>)[code] ?? 'Não foi possível mudar de plano.' };
}

async function carregar(exec: Exec, userId: string, planoParaId: string) {
  const [para] = await exec.select().from(planos).where(eq(planos.id, planoParaId)).limit(1);
  const consulta = exec.select({ a: assinaturas, tier: planos.tier, valorMensal: planos.valorMensal, valorAnual: planos.valorAnual, nome: planos.nome })
    .from(assinaturas).innerJoin(planos, eq(planos.id, assinaturas.planoId))
    .where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'),
      inArray(assinaturas.status, ['ativa', 'inadimplente']),
    ))
    .orderBy(sql`CASE ${assinaturas.status} WHEN 'ativa' THEN 0 ELSE 1 END`, desc(assinaturas.createdAt))
    .limit(1);
  // REV-09 — dentro da transação da troca (com `lockTrocaUsuario`), a linha da
  // assinatura é lida com FOR UPDATE: `canceladaEm` e `status` não mudam por
  // baixo enquanto a troca decide e aplica. Fora de transação (prévia), leitura simples.
  const [linha] = exec === db ? await consulta : await consulta.for('update', { of: assinaturas });
  // XG50 — no anual, o valor do ciclo é o anual (proporcional e gateway no ciclo anual).
  const lida = linha ? { ...linha, valor: String(valorDoCiclo({ valorMensal: linha.valorMensal, valorAnual: linha.valorAnual }, linha.a.ciclo)) } : null;
  const agendada = await trocaAgendadaDoUsuario(exec, userId);
  return { para, lida, agendada };
}

type Contexto = Awaited<ReturnType<typeof carregar>>;
type DecisaoEfetiva = Exclude<DecisaoTroca, { acao: 'checkout' | 'bloquear' }>;

function decidir(ctx: Contexto): DecisaoEfetiva | ErroTroca {
  const { para, lida, agendada } = ctx;
  if (!para || !para.ativo || para.persona !== 'xgestao') return erro('PLANO_INVALIDO', undefined, 404);
  const decisao = decidirTroca({
    assinatura: lida ? {
      status: lida.a.status, provider: lida.a.gatewayProvider, tier: lida.tier,
      canceladaEm: lida.a.canceladaEm, primeiroPagamentoEm: lida.a.primeiroPagamentoEm, fimTesteEm: lida.a.fimTesteEm, renovaEm: lida.a.renovaEm,
    } : null,
    agendada: agendada ? { tierDe: agendada.tierDe, tierPara: agendada.tierPara } : null,
    tierPara: para.tier,
  });
  if (decisao.acao === 'checkout') return erro('SEM_ASSINATURA');
  if (decisao.acao === 'bloquear') return erro(decisao.codigo, undefined, decisao.codigo === 'PLANO_INVALIDO' ? 404 : 409);
  return decisao;
}

async function diferencasNaoPagas(exec: Exec, assinaturaId: string): Promise<string[]> {
  const rows = await exec.select({ d: assinaturaTrocas.valorDiferenca }).from(assinaturaTrocas).where(and(
    eq(assinaturaTrocas.assinaturaId, assinaturaId), eq(assinaturaTrocas.tipo, 'subir'),
    eq(assinaturaTrocas.status, 'aplicada'), sql`${assinaturaTrocas.quitadaEm} IS NULL`,
  ));
  return rows.map((r) => r.d);
}

async function montarPrevia(exec: Exec, userId: string, ctx: Contexto, decisao: DecisaoEfetiva, agora = new Date()): Promise<PreviaTroca> {
  const { para, lida } = ctx;
  const atual = lida!;
  const planoAtual: PlanoResumo = { id: atual.a.planoId, tier: atual.tier, nome: atual.nome, valor: Number(atual.valor) };
  const planoNovo: PlanoResumo = { id: para!.id, tier: para!.tier, nome: para!.nome, valor: valorDoCiclo(para!, atual.a.ciclo) };
  const renovaEm = atual.a.renovaEm;
  const pendentes = await diferencasNaoPagas(exec, atual.a.id);

  const subindo = decisao.acao === 'subir' || decisao.acao === 'desfazer_e_subir' || decisao.acao === 'subir_sem_proporcional';
  const proporcional = (decisao.acao === 'subir' || decisao.acao === 'desfazer_e_subir') && renovaEm
    ? calcularProporcional({ valorAtual: planoAtual.valor, valorNovo: planoNovo.valor, renovaEm, agora, ciclo: atual.a.ciclo === 'anual' ? 'anual' : 'mensal' })
    : { diasCiclo: 0, diasRestantes: 0, diferenca: 0 };

  let excedentes: PreviaTroca['excedentes'] = null;
  if (decisao.acao === 'descer' || decisao.acao === 'descer_imediata') {
    const empresaId = await empresaDoTitular(exec, userId);
    const limites = limitesTier(planoNovo.tier);
    const limitesAtuais = limitesTier(planoAtual.tier);
    const abertas = empresaId ? await obrasEditaveis(exec, empresaId) : [];
    const membros = empresaId ? await membrosComVaga(exec, empresaId, userId) : [];
    const links = empresaId ? await linksAtivosDaEmpresa(exec, empresaId) : [];
    const vagasMembros = Math.max(0, limites.pessoasEmpresa - 1);
    excedentes = {
      obras: {
        limite: limites.obrasAtivas,
        emAndamento: abertas.map((o) => ({ id: o.id, nome: o.nome })),
        precisaEscolher: limites.obrasAtivas >= 0 && abertas.length > limites.obrasAtivas,
      },
      membros: {
        limite: vagasMembros,
        lista: membros.map((m) => ({ id: m.id, nome: m.nome, email: m.email, status: m.status })),
        precisaEscolher: membros.length > vagasMembros,
      },
      links: { limitePorObra: limites.linksPorObra, pausados: linksExcedentes(links, limites.linksPorObra).length },
      perdeValoresPublicos: limitesAtuais.valoresPublicos && !limites.valoresPublicos,
    };
  }

  const efetivaEm = decisao.acao === 'descer' && renovaEm ? renovaEm : agora;
  const tipo: PreviaTroca['tipo'] = decisao.acao === 'desfazer' ? 'desfazer' : subindo ? 'subir' : 'descer';
  // Próxima fatura: plano que vale no próximo ciclo + diferenças não pagas.
  const valorCiclo = decisao.acao === 'desfazer' ? planoAtual.valor : planoNovo.valor;
  return {
    acao: decisao.acao,
    tipo,
    planoAtual,
    planoNovo: decisao.acao === 'desfazer' ? planoAtual : planoNovo,
    efetivaEm: efetivaEm.toISOString(),
    proximaFaturaEm: renovaEm?.toISOString() ?? null,
    diferenca: proporcional.diferenca,
    diasRestantes: proporcional.diasRestantes,
    diasCiclo: proporcional.diasCiclo,
    valorProximaFatura: valorProximaFatura(valorCiclo, [...pendentes, proporcional.diferenca]),
    valorDepois: valorCiclo,
    excedentes,
  };
}

async function preparar(userId: string) {
  await recuperarTrocasPendentes(userId);
  await expirarTestesVencidos(userId);
  await encerrarCancelamentosVencidos(userId);
  await aplicarTrocasVencidas(userId);
}

/** Cálculo e lista do que excede, sem efeito nenhum. */
export async function previaTroca(userId: string, planoParaId: string): Promise<{ ok: true; previa: PreviaTroca } | ErroTroca> {
  await preparar(userId);
  const ctx = await carregar(db, userId, planoParaId);
  const decisao = decidir(ctx);
  if ('ok' in decisao) return decisao;
  return { ok: true, previa: await montarPrevia(db, userId, ctx, decisao) };
}

/** Troca pendente além disto é considerada interrompida (processo caiu). */
const PENDENTE_EXPIRA_MS = 2 * 60_000;

const MSG_FALHA_GATEWAY = 'Não foi possível mudar o plano agora. Nada foi alterado. Tente novamente em instantes.';
const MSG_INTERROMPIDA = 'Não foi possível concluir a mudança de plano. Nada foi alterado. Tente novamente.';

/**
 * Test-only seam: roda dentro da transação de aplicação, depois do PUT no
 * gateway. Um teste que lança aqui simula "o commit falhou depois do PUT".
 * Nunca usar em código de produção.
 */
export const _hooksTrocaParaTeste: { depoisDoGateway?: () => void | Promise<void> } = {};

type MetaGateway = { anterior: number; novo: number; acao: string };

async function registrarErro(mensagem: string, userId: string, meta: Record<string, unknown>) {
  try {
    const { logError } = await import('@/server/lib/logger');
    await logError('error', mensagem, { route: 'xgestao.troca-plano', userId, meta });
  } catch (e) {
    console.error('[troca-plano] falha ao registrar erro', e);
  }
}

/** PUT com o valor anterior. Devolve a mensagem de erro, ou null se voltou. */
async function compensarGateway(gateway: PaymentGateway, subId: string, anterior: number): Promise<string | null> {
  try {
    await gateway.atualizarValorAssinatura!(subId, anterior);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

/**
 * Marca a troca pendente como `falhou`. Solta a chave de idempotência: o mesmo
 * diálogo pode tentar de novo. Condicional ao status (uma única transição).
 */
async function marcarFalhou(trocaId: string, erroMsg: string): Promise<boolean> {
  const r = await db.update(assinaturaTrocas)
    .set({ status: 'falhou', erro: erroMsg.slice(0, 500), chaveIdempotencia: null, atualizadaEm: new Date() })
    .where(and(eq(assinaturaTrocas.id, trocaId), eq(assinaturaTrocas.status, 'pendente_gateway')))
    .returning({ id: assinaturaTrocas.id });
  return r.length > 0;
}

/**
 * Trocas `pendente_gateway` mais antigas que o prazo: o processo caiu entre o
 * PUT e a aplicação. Marca `falhou` e devolve o valor anterior ao gateway (o
 * PUT com o mesmo valor é inofensivo se o primeiro nem chegou a sair).
 */
export async function recuperarTrocasPendentes(userId?: string): Promise<number> {
  const limite = new Date(Date.now() - PENDENTE_EXPIRA_MS);
  const presas = await db.select({
    id: assinaturaTrocas.id, userId: assinaturaTrocas.userId, escolhas: assinaturaTrocas.escolhas,
    assinaturaId: assinaturaTrocas.assinaturaId, provider: assinaturas.gatewayProvider, subId: assinaturas.gatewaySubscriptionId,
  }).from(assinaturaTrocas).innerJoin(assinaturas, eq(assinaturas.id, assinaturaTrocas.assinaturaId)).where(and(
    eq(assinaturaTrocas.status, 'pendente_gateway'),
    sql`${assinaturaTrocas.criadaEm} < ${limite}`,
    ...(userId ? [eq(assinaturaTrocas.userId, userId)] : []),
  ));
  let n = 0;
  for (const t of presas) {
    if (!(await marcarFalhou(t.id, 'Interrompida antes de concluir.'))) continue;
    n++;
    const meta = t.escolhas?.gateway;
    let erroCompensacao: string | null = null;
    if (meta && t.subId && t.provider !== 'trial') {
      try {
        const gw = gatewayDaAssinatura(t.provider);
        erroCompensacao = gw.atualizarValorAssinatura ? await compensarGateway(gw, t.subId, meta.anterior) : null;
      } catch (err) {
        erroCompensacao = err instanceof Error ? err.message : String(err);
      }
    }
    await registrarErro('[troca-plano] troca pendente interrompida; marcada como falhou', t.userId, {
      trocaId: t.id, assinaturaId: t.assinaturaId, compensada: erroCompensacao === null, erroCompensacao,
    });
  }
  return n;
}

type Escolhas = { obras?: string[]; membros?: string[] };

/** Efeitos da troca, dentro da transação, sobre a linha já gravada. */
async function aplicarTroca(
  tx: Tx, userId: string, trocaId: string, ctx: Contexto, decisao: DecisaoEfetiva, previa: PreviaTroca, escolhas: Escolhas,
): Promise<ResultadoTroca> {
  const atual = ctx.lida!;
  const para = ctx.para!;
  const empresaId = await empresaDoTitular(tx, userId);
  const agora = new Date();

  if (decisao.acao === 'desfazer' || decisao.acao === 'desfazer_e_subir') {
    await tx.update(assinaturaTrocas).set({ status: 'desfeita', atualizadaEm: agora })
      .where(and(eq(assinaturaTrocas.id, ctx.agendada!.id), eq(assinaturaTrocas.status, 'agendada')));
    await tx.insert(assinaturaEventos).values({ assinaturaId: atual.a.id, tipo: 'troca_desfeita', payloadJson: { trocaId: ctx.agendada!.id } });
    if (decisao.acao === 'desfazer') {
      // Registro do pedido (para a idempotência), sem efeito de plano.
      await tx.update(assinaturaTrocas).set({ status: 'desfeita', efetivaEm: agora, aplicadaEm: agora, escolhas: {}, atualizadaEm: agora })
        .where(eq(assinaturaTrocas.id, trocaId));
      return { ok: true, repetida: false, trocaId, status: 'desfeita', previa };
    }
  }

  if (decisao.acao === 'subir' || decisao.acao === 'subir_sem_proporcional' || decisao.acao === 'desfazer_e_subir') {
    await tx.update(assinaturas).set({ planoId: para.id }).where(eq(assinaturas.id, atual.a.id));
    await tx.update(assinaturaTrocas).set({
      valorDiferenca: previa.diferenca.toFixed(2), diasRestantes: previa.diasRestantes, diasCiclo: previa.diasCiclo,
      status: 'aplicada', efetivaEm: agora, aplicadaEm: agora, ajustePendente: previa.diferenca > 0, escolhas: {}, atualizadaEm: agora,
    }).where(eq(assinaturaTrocas.id, trocaId));
    const restauradas = empresaId ? await restaurarMarcas(tx, empresaId, userId, para.tier) : null;
    await tx.insert(assinaturaEventos).values({
      assinaturaId: atual.a.id, tipo: 'troca_subir', gatewayEventId: `troca_${trocaId}`,
      payloadJson: { trocaId, tierDe: atual.tier, tierPara: para.tier, diferenca: previa.diferenca, diasRestantes: previa.diasRestantes, diasCiclo: previa.diasCiclo, ...(restauradas ?? {}) },
    });
    return { ok: true, repetida: false, trocaId, status: 'aplicada', previa };
  }

  // Descer.
  const imediata = decisao.acao === 'descer_imediata';
  await tx.update(assinaturaTrocas).set({
    status: imediata ? 'aplicada' : 'agendada', efetivaEm: new Date(previa.efetivaEm), aplicadaEm: imediata ? agora : null, escolhas, atualizadaEm: agora,
  }).where(eq(assinaturaTrocas.id, trocaId));
  let marcas: Awaited<ReturnType<typeof aplicarMarcas>> | null = null;
  if (imediata) {
    await tx.update(assinaturas).set({ planoId: para.id }).where(eq(assinaturas.id, atual.a.id));
    if (empresaId) marcas = await aplicarMarcas(tx, empresaId, userId, para.tier, escolhas);
  }
  await tx.insert(assinaturaEventos).values({
    assinaturaId: atual.a.id, tipo: imediata ? 'troca_descer_aplicada' : 'troca_descer_agendada', gatewayEventId: `troca_${trocaId}`,
    payloadJson: { trocaId, tierDe: atual.tier, tierPara: para.tier, efetivaEm: previa.efetivaEm, escolhas, ...(marcas ?? {}) },
  });
  return { ok: true, repetida: false, trocaId, status: imediata ? 'aplicada' : 'agendada', previa };
}

type Pendente = {
  trocaId: string;
  assinaturaId: string;
  planoDeId: string;
  acao: DecisaoEfetiva['acao'];
  escolhas: Escolhas;
  gateway: PaymentGateway;
  subId: string;
  meta: MetaGateway & { tierDe: string; tierPara: string; planoParaId: string };
};

type Fase1 = { fim: ResultadoTroca; assinaturaAfetada: string | null } | { pendente: Pendente };

class ConflitoTroca extends Error {}

export async function confirmarTroca(userId: string, input: {
  planoId: string;
  chave: string;
  obras?: string[];
  membros?: string[];
  ciente?: boolean;
}): Promise<ResultadoTroca> {
  if (!input.chave || input.chave.length < 8) return erro('CHAVE_OBRIGATORIA', 'Pedido sem chave de idempotência.', 400);
  await preparar(userId);

  // ── 1. Decide e grava (pendente ou já aplicada, se não há gateway) ─────────
  let fase1: Fase1;
  try {
    fase1 = await db.transaction(async (tx): Promise<Fase1> => {
      const fim = (r: ResultadoTroca, assinaturaAfetada: string | null = null): Fase1 => ({ fim: r, assinaturaAfetada });
      await lockTrocaUsuario(tx, userId);
      // REV-10: a chave vale por titular.
      const [repetida] = await tx.select({ id: assinaturaTrocas.id, status: assinaturaTrocas.status })
        .from(assinaturaTrocas)
        .where(and(eq(assinaturaTrocas.userId, userId), eq(assinaturaTrocas.chaveIdempotencia, input.chave)))
        .limit(1);
      if (repetida) return fim({ ok: true, repetida: true, trocaId: repetida.id, status: repetida.status, previa: null });
      const [emAndamento] = await tx.select({ id: assinaturaTrocas.id }).from(assinaturaTrocas)
        .where(and(eq(assinaturaTrocas.userId, userId), eq(assinaturaTrocas.status, 'pendente_gateway'))).limit(1);
      if (emAndamento) {
        return fim(erro('TROCA_EM_ANDAMENTO', 'Já existe uma mudança de plano em andamento. Aguarde alguns segundos e tente de novo.'));
      }

      const ctx = await carregar(tx, userId, input.planoId);
      const decisao = decidir(ctx);
      if ('ok' in decisao) return fim(decisao);
      const previa = await montarPrevia(tx, userId, ctx, decisao);
      const atual = ctx.lida!;
      const para = ctx.para!;
      const empresaId = await empresaDoTitular(tx, userId);

      // Descida: escolha obrigatória até o limite e ciência explícita.
      let escolhas: Escolhas = {};
      if (previa.excedentes) {
        const ex = previa.excedentes;
        const erroObras = validarEscolha(ex.obras.emAndamento.map((o) => o.id), input.obras, ex.obras.limite);
        const erroMembros = validarEscolha(ex.membros.lista.map((m) => m.id), input.membros, ex.membros.limite);
        if (erroObras) return fim(erro('ESCOLHA_INVALIDA', `Obras: ${erroObras}`, 400));
        if (erroMembros) return fim(erro('ESCOLHA_INVALIDA', `Pessoas: ${erroMembros}`, 400));
        if ((ex.obras.precisaEscolher || ex.membros.precisaEscolher || ex.links.pausados > 0 || ex.perdeValoresPublicos) && input.ciente !== true) {
          return fim(erro('CIENCIA_OBRIGATORIA', 'Confirme que entendeu que as demais ficarão só para visualização e que a escolha não poderá ser alterada.', 400));
        }
        escolhas = {
          obras: ex.obras.precisaEscolher ? input.obras : ex.obras.emAndamento.map((o) => o.id),
          membros: ex.membros.precisaEscolher ? input.membros : ex.membros.lista.map((m) => m.id),
        };
      }

      // Valor que a assinatura passa a ter no gateway (próximos ciclos) e o que
      // ela tem hoje: com descida agendada, o gateway já está no valor menor.
      const valorGateway = previa.valorDepois;
      const valorAnterior = ctx.agendada ? Number(ctx.agendada.valorPara) : Number(atual.valor);
      const subId = atual.a.gatewaySubscriptionId;
      let gateway: PaymentGateway | null = null;
      if (subId && atual.a.gatewayProvider !== 'trial') {
        const gw = gatewayDaAssinatura(atual.a.gatewayProvider); // lança GatewayNaoConfigurado
        if (gw.atualizarValorAssinatura) gateway = gw;
      }

      const agora = new Date();
      const desfazer = decisao.acao === 'desfazer';
      const subindo = decisao.acao === 'subir' || decisao.acao === 'subir_sem_proporcional' || decisao.acao === 'desfazer_e_subir';
      const meta: MetaGateway = { anterior: valorAnterior, novo: valorGateway, acao: decisao.acao };
      const [row] = await tx.insert(assinaturaTrocas).values({
        userId, empreiteiraId: empresaId, assinaturaId: atual.a.id,
        planoDeId: atual.a.planoId, tierDe: atual.tier, valorDe: String(atual.valor),
        chaveIdempotencia: input.chave,
        planoParaId: desfazer ? atual.a.planoId : para.id,
        tierPara: desfazer ? atual.tier : para.tier,
        tipo: desfazer || subindo ? 'subir' : 'descer',
        valorPara: desfazer ? String(atual.valor) : String(valorDoCiclo(para, atual.a.ciclo)),
        valorDiferenca: subindo ? previa.diferenca.toFixed(2) : '0',
        diasRestantes: subindo ? previa.diasRestantes : 0,
        diasCiclo: subindo ? previa.diasCiclo : 0,
        status: 'pendente_gateway',
        efetivaEm: subindo || desfazer ? agora : new Date(previa.efetivaEm),
        escolhas: { ...escolhas, ...(gateway ? { gateway: meta } : {}) },
      }).returning({ id: assinaturaTrocas.id });

      if (!gateway || !subId) {
        // Sem gateway a atualizar (mês bônus sem assinatura no gateway): aplica já.
        return fim(await aplicarTroca(tx, userId, row.id, ctx, decisao, previa, escolhas), atual.a.id);
      }
      return {
        pendente: {
          trocaId: row.id, assinaturaId: atual.a.id, planoDeId: atual.a.planoId, acao: decisao.acao, escolhas, gateway, subId,
          meta: { ...meta, tierDe: atual.tier, tierPara: para.tier, planoParaId: para.id },
        },
      };
    });
  } catch (err) {
    if (ehGatewayNaoConfigurado(err)) {
      console.error('[troca-plano] ERRO de configuração do gateway:', err.message);
      return erro('GATEWAY_NAO_CONFIGURADO', MENSAGEM_PAGAMENTOS_INDISPONIVEIS, 503);
    }
    throw err;
  }

  if ('fim' in fase1) {
    if (fase1.fim.ok && !fase1.fim.repetida && fase1.assinaturaAfetada) await sincronizarCobrancaPendente(fase1.assinaturaAfetada);
    return fase1.fim;
  }

  const p = fase1.pendente;
  const dadosLog = { trocaId: p.trocaId, assinaturaId: p.assinaturaId, planoParaId: p.meta.planoParaId, tierDe: p.meta.tierDe, tierPara: p.meta.tierPara, acao: p.acao };

  // ── 2. PUT no gateway, fora de transação ───────────────────────────────────
  try {
    await p.gateway.atualizarValorAssinatura!(p.subId, p.meta.novo);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await marcarFalhou(p.trocaId, msg);
    await registrarErro('[troca-plano] gateway recusou a troca de plano', userId, { ...dadosLog, erro: msg });
    return erro('GATEWAY_ERROR', MSG_FALHA_GATEWAY, 502);
  }

  // ── 3. Aplica, com lock e conferência do estado ────────────────────────────
  let resultado: ResultadoTroca;
  try {
    resultado = await db.transaction(async (tx) => {
      await lockTrocaUsuario(tx, userId);
      const [row] = await tx.select({ status: assinaturaTrocas.status }).from(assinaturaTrocas).where(eq(assinaturaTrocas.id, p.trocaId));
      if (row?.status !== 'pendente_gateway') throw new ConflitoTroca(`troca não está mais pendente (${row?.status ?? 'ausente'})`);
      await _hooksTrocaParaTeste.depoisDoGateway?.();
      const ctx = await carregar(tx, userId, p.meta.planoParaId);
      const decisao = decidir(ctx);
      if ('ok' in decisao) throw new ConflitoTroca(`estado mudou: ${decisao.code}`);
      if (decisao.acao !== p.acao || ctx.lida?.a.id !== p.assinaturaId || ctx.lida.a.planoId !== p.planoDeId) {
        throw new ConflitoTroca(`estado mudou: ${decisao.acao}`);
      }
      const previa = await montarPrevia(tx, userId, ctx, decisao);
      return aplicarTroca(tx, userId, p.trocaId, ctx, decisao, previa, p.escolhas);
    });
  } catch (err) {
    // Depois do PUT algo falhou: volta o valor no gateway e marca `falhou`.
    const msg = err instanceof Error ? err.message : String(err);
    const erroCompensacao = await compensarGateway(p.gateway, p.subId, p.meta.anterior);
    await marcarFalhou(p.trocaId, `Falhou depois do gateway: ${msg}${erroCompensacao ? ` | compensação falhou: ${erroCompensacao}` : ''}`);
    await registrarErro(
      erroCompensacao
        ? '[troca-plano] ATENÇÃO: troca falhou depois do PUT e a compensação no gateway também falhou'
        : '[troca-plano] troca falhou depois do PUT; valor anterior restaurado no gateway',
      userId,
      { ...dadosLog, erro: msg, valorAnterior: p.meta.anterior, erroCompensacao },
    );
    return erro(err instanceof ConflitoTroca ? 'TROCA_INTERROMPIDA' : 'GATEWAY_ERROR', err instanceof ConflitoTroca ? MSG_INTERROMPIDA : MSG_FALHA_GATEWAY, err instanceof ConflitoTroca ? 409 : 502);
  }

  // Depois do commit: o PUT da assinatura com `updatePendingPayments`
  // sobrescreve a cobrança pendente; reaplica a soma das diferenças não pagas.
  if (resultado.ok && !resultado.repetida) await sincronizarCobrancaPendente(p.assinaturaId);
  return resultado;
}
