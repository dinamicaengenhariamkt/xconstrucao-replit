import 'server-only';

import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { inicioDoPeriodo, type PeriodoAdmin } from '../lib/estornos';
import { resumirMotivosCancelamento, type ContagemMotivo } from '@features/xgestao/lib/motivo-cancelamento';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturas, planos } from '@shared/db/schema';
import {
  calcularCancelamentos,
  calcularFunil,
  calcularReceitaPorPlano,
  inicioDoMesSaoPaulo,
  jornadaDoTeste,
  type AssinaturaHistorica,
  type Cancelamentos,
  type FunilTeste,
  type ReceitaPlanos,
  type SaidaAssinante,
} from '../lib/metricas-comerciais';
import { listarAssinantesDetalhados, receitaPorCliente, type XgestaoAssinanteDetalhe } from './assinantes';
import { precoMensalEquivalente } from './preco-sql';

/** Assinante como aparece nas listas da tela: sempre com link para o detalhe. */
export interface AssinanteRef {
  userId: string;
  empreiteiraNome: string;
  nome: string | null;
}

export interface MetricasComerciais {
  /** ADM-06 — `semEmpresa`: liberados que ainda não cadastraram a empresa. */
  funil: FunilTeste & { semEmpresa: number };
  /** Últimas conversões e perdas do teste, para agir (remarketing). */
  recentes: {
    convertidos: Array<AssinanteRef & { assinouEm: string; comBonus: boolean; plano: string | null; diasAteAssinar: number }>;
    perdidos: Array<AssinanteRef & { fimTeste: string | null }>;
  };
  cancelamentos: Omit<Cancelamentos, 'saidas'> & { saidas: Array<SaidaAssinante & AssinanteRef> };
  receita: ReceitaPlanos & {
    /** Quem mais pagou até hoje (soma das mensalidades no caixa). */
    topClientes: Array<AssinanteRef & { total: number; pagamentos: number; ultimoEm: string | null }>;
  };
  /**
   * CRM-03 — pedidos de cancelamento no período, contados por motivo (um por
   * assinatura). "Não informou" = cancelou sem escolher.
   */
  motivosCancelamento: { periodo: PeriodoAdmin; desde: string; total: number; porMotivo: ContagemMotivo[] };
}

const MAX_RECENTES = 10;

/**
 * Todas as assinaturas do xgestão dos usuários, agrupadas por usuário, e as que
 * tiveram o fim agendado cumprido pelo job (`cancelamento_efetivado`). Base do
 * funil, dos cancelamentos (XG45) e do histórico mensal (XG46).
 */
export async function historicoDeAssinaturas(userIds: string[]): Promise<{
  porUsuario: Map<string, AssinaturaHistorica[]>;
  efetivadas: Set<string>;
}> {
  const porUsuario = new Map<string, AssinaturaHistorica[]>();
  if (userIds.length === 0) return { porUsuario, efetivadas: new Set() };
  const [linhas, efetivadasRows] = await Promise.all([
    db
      .select({
        id: assinaturas.id,
        userId: assinaturas.userId,
        status: assinaturas.status,
        provider: assinaturas.gatewayProvider,
        tier: planos.tier,
        plano: planos.nome,
        // XG50 — anual conta como valor anual / 12 no MRR.
        preco: precoMensalEquivalente,
        createdAt: assinaturas.createdAt,
        renovaEm: assinaturas.renovaEm,
        canceladaEm: assinaturas.canceladaEm,
        motivoCancelamento: assinaturas.motivoCancelamento,
        motivoCancelamentoTexto: assinaturas.motivoCancelamentoTexto,
      })
      .from(assinaturas)
      .innerJoin(planos, eq(planos.id, assinaturas.planoId))
      .where(and(eq(assinaturas.persona, 'xgestao'), inArray(assinaturas.userId, userIds))),
    db
      .select({ assinaturaId: assinaturaEventos.assinaturaId })
      .from(assinaturaEventos)
      .innerJoin(assinaturas, eq(assinaturas.id, assinaturaEventos.assinaturaId))
      .where(and(
        eq(assinaturaEventos.tipo, 'cancelamento_efetivado'),
        eq(assinaturas.persona, 'xgestao'),
        inArray(assinaturas.userId, userIds),
      )),
  ]);
  for (const linha of linhas as AssinaturaHistorica[]) {
    const lista = porUsuario.get(linha.userId) ?? [];
    lista.push(linha);
    porUsuario.set(linha.userId, lista);
  }
  const efetivadas = new Set(efetivadasRows.flatMap((e) => (e.assinaturaId ? [e.assinaturaId] : [])));
  return { porUsuario, efetivadas };
}

/**
 * XG45 — funil do teste, cancelamentos e receita por plano numa leitura só.
 * Reaproveita a lista de assinantes já carregada (mesma base de todas as telas
 * do admin: responsáveis com entitlement e empresa, sem membros de equipe).
 */
export async function metricasComerciaisXgestao(
  assinantesCarregados?: XgestaoAssinanteDetalhe[],
  agora = new Date(),
  /** CRM-03 — período do resumo de motivos de cancelamento. */
  periodoMotivos: PeriodoAdmin = 'mes',
): Promise<MetricasComerciais> {
  const assinantes = assinantesCarregados ?? (await listarAssinantesDetalhados());
  const userIds = assinantes.map((a) => a.userId);
  const ref = new Map<string, AssinanteRef>(
    assinantes.map((a) => [a.userId, { userId: a.userId, empreiteiraNome: a.empreiteiraNome, nome: a.nome }]),
  );
  const desde = inicioDoMesSaoPaulo(agora);
  const desdeMotivos = inicioDoPeriodo(periodoMotivos, agora);

  const [{ porUsuario, efetivadas }, pedidosRow, pagoPorCliente, motivosRows] = userIds.length === 0
    ? [{ porUsuario: new Map<string, AssinaturaHistorica[]>(), efetivadas: new Set<string>() }, [{ total: 0 }], new Map(), [] as Array<{ motivo: string | null }>] as const
    : await Promise.all([
      historicoDeAssinaturas(userIds),
      // Pedido de cancelamento é o evento do próprio assinante; um por pessoa no mês.
      db
        .select({ total: sql<number>`count(distinct ${assinaturas.userId})::int` })
        .from(assinaturaEventos)
        .innerJoin(assinaturas, eq(assinaturas.id, assinaturaEventos.assinaturaId))
        .where(and(
          eq(assinaturaEventos.tipo, 'cancelamento_agendado'),
          gte(assinaturaEventos.criadoEm, desde),
          eq(assinaturas.persona, 'xgestao'),
          inArray(assinaturas.userId, userIds),
        )),
      receitaPorCliente(userIds),
      // CRM-03 — pedidos do próprio assinante (agendado ou imediato) no período,
      // um por assinatura; o motivo é a coluna gravada pela rota de cancelar.
      db
        .selectDistinctOn([assinaturas.id], { motivo: assinaturas.motivoCancelamento })
        .from(assinaturaEventos)
        .innerJoin(assinaturas, eq(assinaturas.id, assinaturaEventos.assinaturaId))
        .where(and(
          inArray(assinaturaEventos.tipo, ['cancelamento_agendado', 'cancelamento']),
          gte(assinaturaEventos.criadoEm, desdeMotivos),
          eq(assinaturas.persona, 'xgestao'),
          inArray(assinaturas.userId, userIds),
        ))
        .orderBy(assinaturas.id),
    ]);

  const jornadas = assinantes.map((a) => jornadaDoTeste(porUsuario.get(a.userId) ?? [], agora));
  const funil = calcularFunil(jornadas);
  const decididas = jornadas.filter((j) => j !== null);
  const convertidos = decididas
    .filter((j) => j.estado === 'convertido')
    .sort((a, b) => b.assinouEm!.getTime() - a.assinouEm!.getTime())
    .slice(0, MAX_RECENTES)
    .map((j) => ({
      ...ref.get(j.userId)!,
      assinouEm: j.assinouEm!.toISOString(),
      comBonus: j.comBonus,
      plano: j.planoAssinado,
      diasAteAssinar: Math.round(j.diasAteAssinar! * 10) / 10,
    }));
  const perdidos = decididas
    .filter((j) => j.estado === 'perdido')
    .sort((a, b) => (b.fimTeste?.getTime() ?? 0) - (a.fimTeste?.getTime() ?? 0))
    .slice(0, MAX_RECENTES)
    .map((j) => ({ ...ref.get(j.userId)!, fimTeste: j.fimTeste ? j.fimTeste.toISOString() : null }));

  const cancelamentos = calcularCancelamentos(porUsuario, Number(pedidosRow[0]?.total) || 0, agora, efetivadas);
  const receita = calcularReceitaPorPlano(assinantes);
  const topClientes = [...(pagoPorCliente as Map<string, { total: number; pagamentos: number; ultimoEm: string | null }>)]
    .filter(([userId]) => ref.has(userId))
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, MAX_RECENTES)
    .map(([userId, v]) => ({ ...ref.get(userId)!, ...v }));

  return {
    funil: { ...funil, semEmpresa: assinantes.filter((a) => a.semEmpresa).length },
    recentes: { convertidos, perdidos },
    cancelamentos: {
      ...cancelamentos,
      saidas: cancelamentos.saidas.flatMap((s) => (ref.has(s.userId) ? [{ ...s, ...ref.get(s.userId)! }] : [])),
    },
    receita: { ...receita, topClientes },
    motivosCancelamento: {
      periodo: periodoMotivos,
      desde: desdeMotivos.toISOString(),
      ...resumirMotivosCancelamento(motivosRows.map((m) => m.motivo)),
    },
  };
}

/** Resumo enxuto para a home: só os números, a lista fica na página própria. */
export function resumoComercial(m: MetricasComerciais) {
  return {
    taxaConversao: m.funil.taxaConversao,
    emTeste: m.funil.emTeste,
    convertidos: m.funil.convertidos,
    mrr: m.receita.mrr,
    ticketMedio: m.receita.ticketMedio,
    encerradosNoMes: m.cancelamentos.encerradosNoMes.quantidade,
    mrrPerdidoNoMes: m.cancelamentos.encerradosNoMes.mrr,
    agendados: m.cancelamentos.agendados.quantidade,
    mrrEmRisco: m.receita.mrrEmRisco + m.receita.mrrSaindo,
  };
}
