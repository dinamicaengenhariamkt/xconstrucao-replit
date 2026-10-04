import { and, desc, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { XGESTAO_OBRA } from './escopo';
import {
  assinaturas,
  empreiteiras,
  financeiro,
  obraOcorrencias,
  obraShareLinks,
  obras,
  planos,
  userRoles,
  users,
  xgestaoMembros,
} from '@shared/db/schema';
import { listarMembrosEmpreiteirasXgestao, type XgestaoMembroEmpresa } from './escopo';
import { custoRealPorObra, custoRealTotal } from './custo-real';
import { obraAtrasada, obraParada } from './situacao';
import { getDiasObraParada } from '@features/admin/platform-settings/server/settings-reader';
import { expirarTestesVencidos, fimTestePorUsuario } from '@features/xgestao/teste/server/teste-service';

export type XgestaoTier = 'free' | 'pro' | 'enterprise';

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
      pagamentosAtrasados: number;
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
 * O entitlement (user_roles) é a fonte dos assinantes: quem usa o plano free
 * não precisa ter uma assinatura de cobrança. Uma assinatura xgestão ativa só
 * complementa o tier comercial, sem consultar nem alterar o plano marketplace.
 */
export async function getXgestaoAdminDashboard(): Promise<XgestaoAdminDashboard> {
  const [entitlements, freePlan] = await Promise.all([
    db
      .select({
        userId: userRoles.userId,
        entradaEm: userRoles.criadoEm,
        email: users.email,
        responsavel: users.name,
        empreiteiraId: empreiteiras.id,
        empreiteiraNome: empreiteiras.nome,
      })
      .from(userRoles)
      .innerJoin(users, eq(users.id, userRoles.userId))
      // O convite de equipe concede role xgestao para autenticar o membro, mas
      // esse entitlement técnico não é uma assinatura/empresa independente.
      .leftJoin(xgestaoMembros, eq(xgestaoMembros.userId, userRoles.userId))
      .leftJoin(empreiteiras, eq(empreiteiras.userId, users.id))
      .where(and(eq(userRoles.role, 'xgestao'), isNull(xgestaoMembros.id)))
      .orderBy(desc(userRoles.criadoEm)),
    db
      .select({ nome: planos.nome })
      .from(planos)
      .where(and(eq(planos.persona, 'xgestao'), eq(planos.tier, 'free')))
      .limit(1),
  ]);

  const userIds = entitlements.map((item) => item.userId);
  const empreiteiraIds = [...new Set(entitlements.flatMap((item) => item.empreiteiraId ? [item.empreiteiraId] : []))];
  await expirarTestesVencidos();
  const [membros, fimTestes] = await Promise.all([
    listarMembrosEmpreiteirasXgestao(empreiteiraIds),
    fimTestePorUsuario(userIds),
  ]);
  const membrosPorEmpreiteira = new Map<string, XgestaoMembroEmpresa[]>();
  for (const membro of membros) {
    const lista = membrosPorEmpreiteira.get(membro.empreiteiraId) ?? [];
    lista.push(membro);
    membrosPorEmpreiteira.set(membro.empreiteiraId, lista);
  }
  // Uma assinatura ativa pode anteceder a conclusão do perfil da empreiteira.
  // Resolver os planos antes do retorno sem obras evita classificar todos como free.
  const subscriptionRows = userIds.length === 0
    ? []
    : await db
      .select({
        userId: assinaturas.userId,
        status: assinaturas.status,
        iniciadaEm: assinaturas.iniciadaEm,
        tier: planos.tier,
        planoNome: planos.nome,
      })
      .from(assinaturas)
      .innerJoin(planos, eq(planos.id, assinaturas.planoId))
      .where(and(eq(assinaturas.persona, 'xgestao'), inArray(assinaturas.userId, userIds)));
  const activeSubscriptions = new Map<string, typeof subscriptionRows[number]>();
  for (const subscription of subscriptionRows) {
    if (subscription.status !== 'ativa') continue;
    const current = activeSubscriptions.get(subscription.userId);
    if (!current || subscription.iniciadaEm > current.iniciadaEm) {
      activeSubscriptions.set(subscription.userId, subscription);
    }
  }

  if (empreiteiraIds.length === 0) {
    const distribuicaoPlanos: Record<XgestaoTier, number> = { free: 0, pro: 0, enterprise: 0 };
    const assinantes = entitlements.map((entitlement) => {
      const subscription = activeSubscriptions.get(entitlement.userId);
      const tier = (subscription?.tier ?? 'free') as XgestaoTier;
      distribuicaoPlanos[tier] += 1;
      return {
        id: entitlement.userId,
        empreiteira: 'Perfil ainda não concluído',
        responsavel: entitlement.responsavel,
        email: entitlement.email,
        membros: [],
        obrasGerenciadas: 0,
        plano: { tier, nome: subscription?.planoNome ?? freePlan[0]?.nome ?? 'Freemium' },
        fimTeste: fimTestes.get(entitlement.userId) ?? null,
        entradaEm: entitlement.entradaEm.toISOString(),
      };
    });
    return {
      indicadores: {
        assinantes: entitlements.length,
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
        totais: { ocorrenciasAbertas: 0, pagamentosAtrasados: 0, obrasPausadas: 0 },
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
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(financeiro)
        .innerJoin(obras, eq(obras.id, financeiro.obraId))
        .where(and(
          eq(financeiro.escopo, 'obra'),
          eq(financeiro.status, 'atrasado'),
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
        eq(financeiro.status, 'atrasado'),
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

  const obrasPorEmpreiteira = new Map(
    obraCountRows.map((row) => [row.empreiteiraId, Number(row.total) || 0]),
  );
  const distribuicaoPlanos: Record<XgestaoTier, number> = { free: 0, pro: 0, enterprise: 0 };
  const distribuicaoStatus = { ...STATUS_VAZIO };
  for (const row of statusRows) {
    distribuicaoStatus[row.status] = Number(row.total) || 0;
  }
  const planoFreeNome = freePlan[0]?.nome ?? 'Freemium';

  const assinantes = entitlements.map((entitlement) => {
    const subscription = activeSubscriptions.get(entitlement.userId);
    const tier = (subscription?.tier ?? 'free') as XgestaoTier;
    distribuicaoPlanos[tier] += 1;

    return {
      id: entitlement.userId,
      empreiteira: entitlement.empreiteiraNome ?? 'Perfil ainda não concluído',
      responsavel: entitlement.responsavel,
      email: entitlement.email,
      membros: (entitlement.empreiteiraId
        ? membrosPorEmpreiteira.get(entitlement.empreiteiraId) ?? []
        : []).map(({ userId, nome, email, papel, status, obras }) => ({ userId, nome, email, papel, status, obras })),
      obrasGerenciadas: entitlement.empreiteiraId
        ? obrasPorEmpreiteira.get(entitlement.empreiteiraId) ?? 0
        : 0,
      plano: {
        tier,
        nome: subscription?.planoNome ?? planoFreeNome,
      },
      // Não há período de teste no modelo atual. O campo preserva o contrato
      // para quando a cobrança passar a registrar essa informação explicitamente.
      fimTeste: fimTestes.get(entitlement.userId) ?? null,
      entradaEm: entitlement.entradaEm.toISOString(),
    };
  });

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
      descricao: `Pagamento atrasado de ${money(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
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
      membrosEquipe: membros.length,
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
        pagamentosAtrasados: Number(alertCounts[1][0]?.total) || 0,
        obrasPausadas: distribuicaoStatus.pausada,
      },
      itens: alertas,
    },
  };
}