import { and, desc, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { XGESTAO_OBRA } from './escopo';
import {
  empreiteiras,
  financeiro,
  obraOcorrencias,
  obraShareLinks,
  obras,
} from '@shared/db/schema';
import type { XgestaoMembroEmpresa } from './escopo';
import type { XgestaoAssinanteDetalhe } from './assinantes';
import { custoRealPorObra, custoRealTotal } from './custo-real';
import { lancamentoAtrasado, obraAtrasada, obraParada } from './situacao';
import { getDiasObraParada } from '@features/admin/platform-settings/server/settings-reader';
import { fimTestePorUsuario } from '@features/xgestao/teste/server/teste-service';

export type XgestaoTier = import('@shared/lib/plans-catalog').PlanoTier;

export interface XgestaoAdminAssinante {
  id: string;
  empreiteira: string;
  responsavel: string | null;
  email: string;
  /** Membros da equipe vinculados à empresa; não são assinantes. */
  membros: Array<Pick<XgestaoMembroEmpresa, 'userId' | 'nome' | 'email' | 'papel' | 'status' | 'obras'>>;
  obrasGerenciadas: number;
  plano: { tier: XgestaoTier; nome: string };
  /** XG35 — fim do teste grátis em andamento (ISO); `null` fora do teste. */
  fimTeste: string | null;
  entradaEm: string;
}

export type XgestaoAdminObraStatus = 'em_andamento' | 'concluida' | 'pausada' | 'planejamento';

export interface XgestaoAdminObra {
  id: string;
  nome: string;
  empreiteira: string;
  status: XgestaoAdminObraStatus;
  cidade: string | null;
  uf: string | null;
  valorTotal: number;
  /** Custo real: saídas pagas pelo dono (`custo-real.ts`), não `obras.valor_pago`. */
  valorPago: number;
  dataPrevisao: string | null;
  atualizadaEm: string | null;
  linkPublicoAtivo: boolean;
}

export interface XgestaoAdminAlerta {
  id: string;
  tipo: 'ocorrencia' | 'financeiro' | 'obra_pausada';
  severidade: 'critica' | 'atencao' | 'info';
  titulo: string;
  descricao: string;
  obraId: string;
  obra: string;
  criadoEm: string | null;
}

export interface XgestaoAdminDashboard {
  indicadores: {
    assinantes: number;
    empreiteirasComPerfil: number;
    membrosEquipe: number;
    obrasGerenciadas: number;
    obrasAtivas: number;
    /** Previsão de término vencida e obra não concluída. Substitui o "Progresso médio" (XG34). */
    obrasAtrasadas: number;
    /** XG36 — em andamento e sem nenhum registro há `diasObraParada` dias. */
    obrasParadas: number;
    diasObraParada: number;
    orcamentoGerenciado: number;
    valorPago: number;
    distribuicaoPlanos: Record<XgestaoTier, number>;
    distribuicaoStatus: Record<XgestaoAdminObraStatus, number>;
    linksPublicosAtivos: number;
  };
  assinantes: XgestaoAdminAssinante[];
  obras: XgestaoAdminObra[];
  alertas: {
    totais: {
      ocorrenciasAbertas: number;
      /** ADM-09 — vencidos e não pagos agora (a receber + a pagar). */
      pagamentosAtrasados: number;
      recebimentosAtrasados: number;
      contasAPagarAtrasadas: number;
      obrasPausadas: number;
    };
    itens: XgestaoAdminAlerta[];
  };
}

const STATUS_VAZIO: Record<XgestaoAdminObraStatus, number> = {
  em_andamento: 0,
  concluida: 0,
  pausada: 0,
  planejamento: 0,
};

function money(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/**
 * Visão administrativa do produto xgestão.
 *
 * ADM-06/07/10: a base é a MESMA lista da página de assinantes
 * (`listarAssinantesDetalhados`), carregada uma vez pela rota e repassada aqui.
 * Antes a home montava a própria base (contava quem não tem empresa, que a
 * lista escondia), escolhia o plano por outra regra e vencia os testes de novo.
 * Contas internas (ADM-02) já vêm fora da lista.
 */
export async function getXgestaoAdminDashboard(lista: XgestaoAssinanteDetalhe[]): Promise<XgestaoAdminDashboard> {
  const userIds = lista.map((item) => item.userId);
  const empreiteiraIds = [...new Set(lista.flatMap((item) => (item.empreiteiraId ? [item.empreiteiraId] : [])))];
  const fimTestes = await fimTestePorUsuario(userIds);
  const membrosEquipe = lista.reduce((total, item) => total + item.membros.length, 0);
  const distribuicaoPlanos: Record<XgestaoTier, number> = { free: 0, pro: 0, enterprise: 0, basic: 0, basic_plus: 0, premium: 0 };
  for (const item of lista) distribuicaoPlanos[item.plano.tier] += 1;
  const assinantes: XgestaoAdminAssinante[] = lista.map((item) => ({
    id: item.userId,
    empreiteira: item.empreiteiraNome,
    responsavel: item.nome,
    email: item.email,
    membros: item.membros,
    obrasGerenciadas: item.obrasGerenciadas,
    plano: { tier: item.plano.tier, nome: item.plano.nome },
    // XG35/XG43 — fim do teste grátis em andamento (`fimTestePorUsuario`).
    fimTeste: fimTestes.get(item.userId) ?? null,
    entradaEm: item.entradaEm instanceof Date ? item.entradaEm.toISOString() : String(item.entradaEm),
  }));

  if (empreiteiraIds.length === 0) {
    return {
      indicadores: {
        assinantes: lista.length,
        empreiteirasComPerfil: 0,
        membrosEquipe: 0,
        obrasGerenciadas: 0,
        obrasAtivas: 0,
        obrasAtrasadas: 0,
        obrasParadas: 0,
        diasObraParada: 14,
        orcamentoGerenciado: 0,
        valorPago: 0,
        distribuicaoPlanos,
        distribuicaoStatus: { ...STATUS_VAZIO },
        linksPublicosAtivos: 0,
      },
      assinantes,
      obras: [],
      alertas: {
        totais: { ocorrenciasAbertas: 0, pagamentosAtrasados: 0, recebimentosAtrasados: 0, contasAPagarAtrasadas: 0, obrasPausadas: 0 },
        itens: [],
      },
    };
  }

  const diasParada = await getDiasObraParada();
  const [
    obraCountRows,
    obrasAggregate,
    statusRows,
    recentWorks,
    activeLinks,
    alertCounts,
    occurrenceAlerts,
    overdueAlerts,
    pausedAlerts,
  ] = await Promise.all([
    db
      .select({
        empreiteiraId: obras.empreiteiraId,
        total: sql<number>`count(*)::int`,
      })
      .from(obras)
      .where(and(XGESTAO_OBRA, inArray(obras.empreiteiraId, empreiteiraIds)))
      .groupBy(obras.empreiteiraId),
    db
      .select({
        total: sql<number>`count(*)::int`,
        atrasadas: sql<number>`count(*) filter (where ${obraAtrasada})::int`,
        paradas: sql<number>`count(*) filter (where ${obraParada(diasParada)})::int`,
        orcamento: sql<string>`coalesce(sum(${obras.valorTotal}), 0)`,
      })
      .from(obras)
      .where(and(XGESTAO_OBRA, inArray(obras.empreiteiraId, empreiteiraIds))),
    db
      .select({ status: obras.status, total: sql<number>`count(*)::int` })
      .from(obras)
      .where(and(XGESTAO_OBRA, inArray(obras.empreiteiraId, empreiteiraIds)))
      .groupBy(obras.status),
    db
      .select({
        id: obras.id,
        nome: obras.nome,
        empreiteira: empreiteiras.nome,
        status: obras.status,
        cidade: obras.cidade,
        uf: obras.uf,
        valorTotal: obras.valorTotal,
        dataPrevisao: obras.dataPrevisao,
        atualizadaEm: obras.updatedAt,
      })
      .from(obras)
      .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
      .where(and(XGESTAO_OBRA, inArray(obras.empreiteiraId, empreiteiraIds)))
      .orderBy(desc(obras.updatedAt))
      .limit(12),
    db
      .select({ obraId: obraShareLinks.obraId })
      .from(obraShareLinks)
      .innerJoin(obras, eq(obras.id, obraShareLinks.obraId))
      .where(and(
        eq(obraShareLinks.ativo, true),
        or(isNull(obraShareLinks.expiraEm), gt(obraShareLinks.expiraEm, new Date())),
        XGESTAO_OBRA,
        inArray(obras.empreiteiraId, empreiteiraIds),
      )),
    Promise.all([
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(obraOcorrencias)
        .innerJoin(obras, eq(obras.id, obraOcorrencias.obraId))
        .where(and(
          eq(obraOcorrencias.status, 'aberta'),
          XGESTAO_OBRA,
          inArray(obras.empreiteiraId, empreiteiraIds),
        )),
      // ADM-09 — calculado na hora (vencido e não pago, dia de SP), por tipo.
      db
        .select({
          receber: sql<number>`(count(*) filter (where ${financeiro.tipo} = 'entrada'))::int`,
          pagar: sql<number>`(count(*) filter (where ${financeiro.tipo} <> 'entrada'))::int`,
        })
        .from(financeiro)
        .innerJoin(obras, eq(obras.id, financeiro.obraId))
        .where(and(
          eq(financeiro.escopo, 'obra'),
          lancamentoAtrasado,
          XGESTAO_OBRA,
          inArray(obras.empreiteiraId, empreiteiraIds),
        )),
    ]),
    db
      .select({
        id: obraOcorrencias.id,
        titulo: obraOcorrencias.titulo,
        gravidade: obraOcorrencias.gravidade,
        obraId: obras.id,
        obra: obras.nome,
        criadoEm: obraOcorrencias.createdAt,
      })
      .from(obraOcorrencias)
      .innerJoin(obras, eq(obras.id, obraOcorrencias.obraId))
      .where(and(
        eq(obraOcorrencias.status, 'aberta'),
        XGESTAO_OBRA,
        inArray(obras.empreiteiraId, empreiteiraIds),
      ))
      .orderBy(desc(obraOcorrencias.createdAt))
      .limit(6),
    db
      .select({
        id: financeiro.id,
        tipo: financeiro.tipo,
        descricao: financeiro.descricao,
        valor: financeiro.valor,
        obraId: obras.id,
        obra: obras.nome,
        criadoEm: financeiro.createdAt,
      })
      .from(financeiro)
      .innerJoin(obras, eq(obras.id, financeiro.obraId))
      .where(and(
        eq(financeiro.escopo, 'obra'),
        lancamentoAtrasado,
        XGESTAO_OBRA,
        inArray(obras.empreiteiraId, empreiteiraIds),
      ))
      .orderBy(desc(financeiro.createdAt))
      .limit(6),
    db
      .select({
        id: obras.id,
        obra: obras.nome,
        empreiteira: empreiteiras.nome,
        atualizadoEm: obras.updatedAt,
      })
      .from(obras)
      .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
      .where(and(
        XGESTAO_OBRA,
        inArray(obras.empreiteiraId, empreiteiraIds),
        eq(obras.status, 'pausada'),
      ))
      .orderBy(desc(obras.updatedAt))
      .limit(6),
  ]);

  const distribuicaoStatus = { ...STATUS_VAZIO };
  for (const row of statusRows) {
    distribuicaoStatus[row.status] = Number(row.total) || 0;
  }

  const [custoPorObra, custoTotal] = await Promise.all([
    custoRealPorObra(recentWorks.map((obra) => obra.id)),
    custoRealTotal(and(XGESTAO_OBRA, inArray(obras.empreiteiraId, empreiteiraIds))),
  ]);

  const activeLinkIds = new Set(activeLinks.map((link) => link.obraId));
  const obrasRecentes: XgestaoAdminObra[] = recentWorks.map((obra) => ({
    id: obra.id,
    nome: obra.nome,
    empreiteira: obra.empreiteira,
    status: obra.status,
    cidade: obra.cidade,
    uf: obra.uf,
    valorTotal: money(obra.valorTotal),
    valorPago: custoPorObra.get(obra.id) ?? 0,
    dataPrevisao: obra.dataPrevisao,
    atualizadaEm: iso(obra.atualizadaEm),
    linkPublicoAtivo: activeLinkIds.has(obra.id),
  }));

  const alertas: XgestaoAdminAlerta[] = [
    ...occurrenceAlerts.map((item): XgestaoAdminAlerta => ({
      id: `ocorrencia:${item.id}`,
      tipo: 'ocorrencia',
      severidade: item.gravidade === 'critico' ? 'critica' : 'atencao',
      titulo: item.titulo,
      descricao: `Ocorrência ${item.gravidade === 'critico' ? 'crítica' : item.gravidade} aberta`,
      obraId: item.obraId,
      obra: item.obra,
      criadoEm: iso(item.criadoEm),
    })),
    ...overdueAlerts.map((item): XgestaoAdminAlerta => ({
      id: `financeiro:${item.id}`,
      tipo: 'financeiro',
      severidade: 'critica',
      titulo: item.descricao,
      descricao: `${item.tipo === 'entrada' ? 'Recebimento atrasado' : 'Conta a pagar atrasada'} de ${money(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      obraId: item.obraId,
      obra: item.obra,
      criadoEm: iso(item.criadoEm),
    })),
    ...pausedAlerts.map((item): XgestaoAdminAlerta => ({
      id: `obra:${item.id}`,
      tipo: 'obra_pausada',
      severidade: 'atencao',
      titulo: 'Obra pausada',
      descricao: `A execução de ${item.obra} está pausada (${item.empreiteira})`,
      obraId: item.id,
      obra: item.obra,
      criadoEm: iso(item.atualizadoEm),
    })),
  ]
    .sort((a, b) => (b.criadoEm ?? '').localeCompare(a.criadoEm ?? ''))
    .slice(0, 8);

  const totalObras = Number(obrasAggregate[0]?.total) || 0;

  return {
    indicadores: {
      assinantes: assinantes.length,
      empreiteirasComPerfil: empreiteiraIds.length,
      membrosEquipe,
      obrasGerenciadas: totalObras,
      obrasAtivas: distribuicaoStatus.em_andamento,
      obrasAtrasadas: Number(obrasAggregate[0]?.atrasadas) || 0,
      obrasParadas: Number(obrasAggregate[0]?.paradas) || 0,
      diasObraParada: diasParada,
      orcamentoGerenciado: money(obrasAggregate[0]?.orcamento),
      valorPago: custoTotal,
      distribuicaoPlanos,
      distribuicaoStatus,
      linksPublicosAtivos: activeLinks.length,
    },
    assinantes,
    obras: obrasRecentes,
    alertas: {
      totais: {
        ocorrenciasAbertas: Number(alertCounts[0][0]?.total) || 0,
        pagamentosAtrasados: (Number(alertCounts[1][0]?.receber) || 0) + (Number(alertCounts[1][0]?.pagar) || 0),
        recebimentosAtrasados: Number(alertCounts[1][0]?.receber) || 0,
        contasAPagarAtrasadas: Number(alertCounts[1][0]?.pagar) || 0,
        obrasPausadas: distribuicaoStatus.pausada,
      },
      itens: alertas,
    },
  };
}