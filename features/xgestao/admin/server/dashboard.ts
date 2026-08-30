import { and, desc, eq, gt, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  assinaturas,
  empreiteiras,
  obraShareLinks,
  obras,
  planos,
  userRoles,
  users,
} from '@shared/db/schema';

export type XgestaoTier = 'free' | 'pro' | 'enterprise';

export interface XgestaoAdminAssinante {
  id: string;
  empreiteira: string;
  email: string;
  obrasGerenciadas: number;
  plano: { tier: XgestaoTier; nome: string };
  fimTeste: string | null;
  entradaEm: string;
}

export interface XgestaoAdminDashboard {
  indicadores: {
    assinantes: number;
    obrasGerenciadas: number;
    distribuicaoPlanos: Record<XgestaoTier, number>;
    linksPublicosAtivos: number;
  };
  assinantes: XgestaoAdminAssinante[];
}

const XGESTAO_OBRA = and(isNull(obras.clienteId), isNotNull(obras.empreiteiraId));

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
        empreiteiraId: empreiteiras.id,
        empreiteiraNome: empreiteiras.nome,
      })
      .from(userRoles)
      .innerJoin(users, eq(users.id, userRoles.userId))
      .leftJoin(empreiteiras, eq(empreiteiras.userId, users.id))
      .where(eq(userRoles.role, 'xgestao'))
      .orderBy(desc(userRoles.criadoEm)),
    db
      .select({ nome: planos.nome })
      .from(planos)
      .where(and(eq(planos.persona, 'xgestao'), eq(planos.tier, 'free')))
      .limit(1),
  ]);

  const userIds = entitlements.map((item) => item.userId);
  const empreiteiraIds = entitlements.flatMap((item) => item.empreiteiraId ? [item.empreiteiraId] : []);

  const [subscriptionRows, obraCountRows, obrasAggregate, activeLinksAggregate] = await Promise.all([
    userIds.length === 0
      ? Promise.resolve([])
      : db
        .select({
          userId: assinaturas.userId,
          status: assinaturas.status,
          iniciadaEm: assinaturas.iniciadaEm,
          tier: planos.tier,
          planoNome: planos.nome,
        })
        .from(assinaturas)
        .innerJoin(planos, eq(planos.id, assinaturas.planoId))
        .where(and(eq(assinaturas.persona, 'xgestao'), inArray(assinaturas.userId, userIds))),
    empreiteiraIds.length === 0
      ? Promise.resolve([])
      : db
        .select({
          empreiteiraId: obras.empreiteiraId,
          total: sql<number>`count(*)::int`,
        })
        .from(obras)
        .where(and(XGESTAO_OBRA, inArray(obras.empreiteiraId, empreiteiraIds)))
        .groupBy(obras.empreiteiraId),
    empreiteiraIds.length === 0
      ? Promise.resolve([{ total: 0 }])
      : db
        .select({ total: sql<number>`count(*)::int` })
        .from(obras)
        .where(and(XGESTAO_OBRA, inArray(obras.empreiteiraId, empreiteiraIds))),
    empreiteiraIds.length === 0
      ? Promise.resolve([{ total: 0 }])
      : db
        .select({ total: sql<number>`count(*)::int` })
        .from(obraShareLinks)
        .innerJoin(obras, eq(obras.id, obraShareLinks.obraId))
        .where(and(
          eq(obraShareLinks.ativo, true),
          or(isNull(obraShareLinks.expiraEm), gt(obraShareLinks.expiraEm, new Date())),
          XGESTAO_OBRA,
          inArray(obras.empreiteiraId, empreiteiraIds),
        )),
  ]);

  const activeSubscriptions = new Map<string, typeof subscriptionRows[number]>();
  for (const subscription of subscriptionRows) {
    if (subscription.status !== 'ativa') continue;
    const current = activeSubscriptions.get(subscription.userId);
    if (!current || subscription.iniciadaEm > current.iniciadaEm) {
      activeSubscriptions.set(subscription.userId, subscription);
    }
  }

  const obrasPorEmpreiteira = new Map(
    obraCountRows.map((row) => [row.empreiteiraId, Number(row.total) || 0]),
  );
  const distribuicaoPlanos: Record<XgestaoTier, number> = { free: 0, pro: 0, enterprise: 0 };
  const planoFreeNome = freePlan[0]?.nome ?? 'Freemium';

  const assinantes = entitlements.map((entitlement) => {
    const subscription = activeSubscriptions.get(entitlement.userId);
    const tier = (subscription?.tier ?? 'free') as XgestaoTier;
    distribuicaoPlanos[tier] += 1;

    return {
      id: entitlement.userId,
      empreiteira: entitlement.empreiteiraNome ?? 'Perfil ainda não concluído',
      email: entitlement.email,
      obrasGerenciadas: entitlement.empreiteiraId
        ? obrasPorEmpreiteira.get(entitlement.empreiteiraId) ?? 0
        : 0,
      plano: {
        tier,
        nome: subscription?.planoNome ?? planoFreeNome,
      },
      // Não há período de teste no modelo atual. O campo preserva o contrato
      // para quando a cobrança passar a registrar essa informação explicitamente.
      fimTeste: null,
      entradaEm: entitlement.entradaEm.toISOString(),
    };
  });

  return {
    indicadores: {
      assinantes: assinantes.length,
      obrasGerenciadas: Number(obrasAggregate[0]?.total) || 0,
      distribuicaoPlanos,
      linksPublicosAtivos: Number(activeLinksAggregate[0]?.total) || 0,
    },
    assinantes,
  };
}