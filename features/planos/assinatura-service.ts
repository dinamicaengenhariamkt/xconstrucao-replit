import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturaEventos, assinaturas, planos, users } from "@shared/db/schema";
import { getPlanCatalog, PLANS_CATALOG, type PlanoPersona, type PlanoTier } from "@shared/lib/plans-catalog";
import { criarLancamentoPlataforma } from "@features/financeiro/lancamentos-service";
import { getPaymentGateway } from "@features/planos/gateway";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface LimitesPlano {
  [key: string]: number;
}

/**
 * Limites efetivos do usuário, derivados do tier ATIVO (`users.plano`) via
 * plans-catalog. Mantém o tier "free" como fallback universal. Esta é a fonte
 * de verdade consumida pelos gates de J03/J05.
 */
export async function getLimitesUsuario(userId: string, tx?: DbOrTx): Promise<LimitesPlano> {
  const client = (tx ?? db) as typeof db;
  const [u] = await client.select({ plano: users.plano, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  const tier = (u?.plano ?? "free") as PlanoTier;
  const persona: PlanoPersona = u?.role === "empreiteiro" ? "empreiteiro" : "contratante";
  return getPlanCatalog(persona, tier).limites;
}

/** Limite de um recurso específico (ex: "propostasMes", "obrasAbertas"). */
export async function getLimiteRecurso(userId: string, recurso: string, tx?: DbOrTx): Promise<number | null> {
  const limites = await getLimitesUsuario(userId, tx);
  const v = limites[recurso];
  return typeof v === "number" ? v : null;
}

/**
 * Indica se o usuário tem assinatura paga ativa. FASE 3 (real): consulta a
 * tabela `assinaturas` (status ativa) e o tier do plano vinculado. Free não
 * conta como "ativa paga".
 */
export async function userTemAssinaturaAtiva(userId: string, tx?: DbOrTx): Promise<boolean> {
  const client = (tx ?? db) as typeof db;
  const [row] = await client
    .select({ tier: planos.tier })
    .from(assinaturas)
    .innerJoin(planos, eq(planos.id, assinaturas.planoId))
    .where(and(eq(assinaturas.userId, userId), eq(assinaturas.status, "ativa")))
    .limit(1);
  return Boolean(row && row.tier !== "free");
}

export async function getAssinaturaAtiva(userId: string): Promise<(typeof assinaturas.$inferSelect & { tier: PlanoTier }) | null> {
  const [row] = await db
    .select({ a: assinaturas, tier: planos.tier })
    .from(assinaturas)
    .innerJoin(planos, eq(planos.id, assinaturas.planoId))
    .where(and(eq(assinaturas.userId, userId), eq(assinaturas.status, "ativa")))
    .limit(1);
  return row ? { ...row.a, tier: row.tier as PlanoTier } : null;
}

export async function listarPlanos(persona?: PlanoPersona): Promise<typeof planos.$inferSelect[]> {
  const conds = [eq(planos.ativo, true)];
  if (persona) conds.push(sql`(${planos.persona} = ${persona} OR ${planos.persona} = 'ambos')`);
  return db.select().from(planos).where(and(...conds)).orderBy(planos.valorMensal);
}

// ─── Checkout / ativação ────────────────────────────────────────────────────
export type CheckoutResult =
  | { ok: true; kind: "activated"; assinaturaId: string }
  | { ok: true; kind: "redirect"; url: string }
  | { ok: false; code: "PLANO_INVALIDO" | "JA_ASSINANTE" };

/**
 * Inicia o checkout de um plano para o usuário. Com o adapter manual, ativa a
 * assinatura imediatamente (sem cobrança), atualiza `users.plano`, e gera a
 * entrada de receita no caixa (J09, escopo plataforma) de forma idempotente.
 *
 * Com um gateway real (J14), retorna { kind: "redirect" } e a ativação ocorre
 * depois, via webhook (aplicarEventoWebhook).
 */
export async function iniciarCheckout(args: {
  userId: string;
  planoId: string;
  ciclo?: "mensal" | "anual";
}): Promise<CheckoutResult> {
  const [plano] = await db.select().from(planos).where(eq(planos.id, args.planoId)).limit(1);
  if (!plano || !plano.ativo) return { ok: false, code: "PLANO_INVALIDO" };

  // Já tem assinatura paga ativa? (free pode "assinar" um pago; pago→pago troca via cancelar antes.)
  const atual = await getAssinaturaAtiva(args.userId);
  if (atual && atual.planoId === args.planoId) return { ok: false, code: "JA_ASSINANTE" };

  const ciclo = args.ciclo ?? "mensal";
  const valor = ciclo === "anual" && plano.valorAnual ? Number(plano.valorAnual) : Number(plano.valorMensal);
  const gateway = getPaymentGateway();

  // Busca nome/email do usuário para gateways externos (ex: ASAS) que precisam
  // criar/encontrar um customer. Falha silenciosa: campos opcionais no adapter.
  const [userRow] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);

  const result = await gateway.createCheckout({
    userId: args.userId,
    planoId: plano.id,
    tier: plano.tier as PlanoTier,
    ciclo,
    valor,
    successUrl: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/planos/sucesso` : undefined,
    userEmail: userRow?.email ?? undefined,
    userName: userRow?.name ?? undefined,
  });

  if (result.kind === "redirect") {
    return { ok: true, kind: "redirect", url: result.url };
  }

  // Ativação imediata (adapter manual): persiste tudo numa transação.
  const assinaturaId = await db.transaction(async (tx) => {
    // Cancela qualquer assinatura ativa anterior (troca de plano).
    await tx
      .update(assinaturas)
      .set({ status: "cancelada", canceladaEm: new Date() })
      .where(and(eq(assinaturas.userId, args.userId), eq(assinaturas.status, "ativa")));

    const renova = new Date();
    if (ciclo === "anual") renova.setFullYear(renova.getFullYear() + 1);
    else renova.setMonth(renova.getMonth() + 1);

    const [nova] = await tx
      .insert(assinaturas)
      .values({
        userId: args.userId,
        planoId: plano.id,
        status: "ativa",
        ciclo,
        renovaEm: renova,
        gatewayProvider: gateway.provider,
        gatewayCustomerId: result.gatewayCustomerId ?? null,
        gatewaySubscriptionId: result.gatewaySubscriptionId ?? null,
      })
      .returning({ id: assinaturas.id });

    // users.plano = tier (dirige o catálogo de limites/gating).
    await tx.update(users).set({ plano: plano.tier, planoStartedAt: new Date() }).where(eq(users.id, args.userId));

    // Evento de checkout (idempotência por gatewaySubscriptionId).
    await tx.insert(assinaturaEventos).values({
      assinaturaId: nova.id,
      tipo: "checkout",
      gatewayEventId: result.gatewaySubscriptionId ? `checkout_${result.gatewaySubscriptionId}` : null,
      payloadJson: { planoId: plano.id, ciclo, valor },
    });

    // Receita no caixa (J09) — só se houver valor (free não gera lançamento).
    if (valor > 0) {
      await criarLancamentoPlataforma({
        tipo: "entrada",
        descricao: `Assinatura ${plano.nome} (${ciclo})`,
        valor,
        categoria: "assinatura",
        status: "pago",
        origemTipo: "assinatura",
        origemId: nova.id,
        recebedorUserId: null,
        pagadorUserId: args.userId,
        tx,
      });
    }

    return nova.id;
  });

  return { ok: true, kind: "activated", assinaturaId };
}

/** Cancela a assinatura ativa do usuário. Rebaixa para free no fim do ciclo. */
export async function cancelarAssinatura(userId: string): Promise<{ ok: boolean }> {
  const atual = await getAssinaturaAtiva(userId);
  if (!atual) return { ok: false };

  const gateway = getPaymentGateway();
  await gateway.cancelSubscription(atual.gatewaySubscriptionId);

  await db.transaction(async (tx) => {
    await tx
      .update(assinaturas)
      .set({ status: "cancelada", canceladaEm: new Date() })
      .where(eq(assinaturas.id, atual.id));
    // Rebaixa o tier para free (limites caem para o fallback).
    await tx.update(users).set({ plano: "free" }).where(eq(users.id, userId));
    await tx.insert(assinaturaEventos).values({
      assinaturaId: atual.id,
      tipo: "cancelamento",
      payloadJson: {},
    });
  });
  return { ok: true };
}

/**
 * Aplica um evento de webhook do gateway de forma IDEMPOTENTE. O evento é
 * deduplicado por `gatewayEventId` (índice único). Reprocessar o mesmo evento
 * não duplica lançamento nem reativa em duplicidade.
 *
 * Suporta o fluxo redirect (ex: ASAS): na ausência de assinatura pré-existente,
 * `payment_succeeded` com `externalReference` cria a assinatura e ativa o usuário.
 */
export async function aplicarEventoWebhook(evt: {
  eventId: string;
  type: string;
  gatewaySubscriptionId?: string;
  gatewayCustomerId?: string;
  externalReference?: string;
  valor?: number;
}): Promise<{ processed: boolean }> {
  return db.transaction(async (tx) => {
    // Dedup: se o evento já foi registrado, ignora.
    const jaExiste = await tx
      .select({ id: assinaturaEventos.id })
      .from(assinaturaEventos)
      .where(eq(assinaturaEventos.gatewayEventId, evt.eventId))
      .limit(1);
    if (jaExiste.length > 0) return { processed: false };

    // Localiza a assinatura pelo id do gateway (se houver).
    let assinaturaId: string | null = null;
    if (evt.gatewaySubscriptionId) {
      const [a] = await tx
        .select({ id: assinaturas.id, userId: assinaturas.userId, planoId: assinaturas.planoId })
        .from(assinaturas)
        .where(eq(assinaturas.gatewaySubscriptionId, evt.gatewaySubscriptionId))
        .limit(1);
      if (a) {
        assinaturaId = a.id;
        if (evt.type === "payment_failed") {
          await tx.update(assinaturas).set({ status: "inadimplente" }).where(eq(assinaturas.id, a.id));
        } else if (evt.type === "subscription_canceled") {
          await tx.update(assinaturas).set({ status: "cancelada", canceladaEm: new Date() }).where(eq(assinaturas.id, a.id));
          await tx.update(users).set({ plano: "free" }).where(eq(users.id, a.userId));
        }
      }
    }

    // Fluxo redirect (ex: ASAS): primeiro pagamento confirmado sem assinatura pré-existente.
    // O externalReference "xconstrucao|userId|planoId|ciclo" permite criar a assinatura agora.
    if (!assinaturaId && (evt.type === "payment_succeeded" || evt.type === "subscription_activated") && evt.externalReference) {
      const parsed = parseExternalRef(evt.externalReference);
      if (parsed) {
        const { userId, planoId, ciclo } = parsed;
        const [plano] = await tx.select().from(planos).where(eq(planos.id, planoId)).limit(1);
        if (plano && plano.ativo) {
          // Cancela assinatura ativa anterior (troca de plano).
          await tx
            .update(assinaturas)
            .set({ status: "cancelada", canceladaEm: new Date() })
            .where(and(eq(assinaturas.userId, userId), eq(assinaturas.status, "ativa")));

          const renova = new Date();
          if (ciclo === "anual") renova.setFullYear(renova.getFullYear() + 1);
          else renova.setMonth(renova.getMonth() + 1);

          const gateway = getPaymentGateway();
          const [nova] = await tx
            .insert(assinaturas)
            .values({
              userId,
              planoId: plano.id,
              status: "ativa",
              ciclo: (ciclo as "mensal" | "anual") ?? "mensal",
              renovaEm: renova,
              gatewayProvider: gateway.provider,
              gatewayCustomerId: evt.gatewayCustomerId ?? null,
              gatewaySubscriptionId: evt.gatewaySubscriptionId ?? evt.externalReference ?? null,
            })
            .returning({ id: assinaturas.id });

          assinaturaId = nova.id;

          // Atualiza tier do usuário.
          await tx
            .update(users)
            .set({ plano: plano.tier, planoStartedAt: new Date() })
            .where(eq(users.id, userId));

          // Lançamento no caixa (J09).
          const valorFinal = evt.valor ?? (ciclo === "anual" && plano.valorAnual ? Number(plano.valorAnual) : Number(plano.valorMensal));
          if (valorFinal > 0) {
            await criarLancamentoPlataforma({
              tipo: "entrada",
              descricao: `Assinatura ${plano.nome} (${ciclo}) — ASAS`,
              valor: valorFinal,
              categoria: "assinatura",
              status: "pago",
              origemTipo: "assinatura",
              origemId: nova.id,
              recebedorUserId: null,
              pagadorUserId: userId,
              tx,
            });
          }

          console.info(`[asaas] assinatura criada via webhook: userId=${userId} plano=${plano.nome} assinaturaId=${nova.id}`);
        }
      }
    }

    await tx.insert(assinaturaEventos).values({
      assinaturaId,
      tipo: evt.type,
      gatewayEventId: evt.eventId,
      payloadJson: {},
    });
    return { processed: true };
  });
}

/** Importado do adapter ASAS para parsear externalReference no webhook. */
function parseExternalRef(ref: string): { userId: string; planoId: string; ciclo: string } | null {
  const parts = ref.split("|");
  if (parts.length !== 4 || parts[0] !== "xconstrucao") return null;
  return { userId: parts[1], planoId: parts[2], ciclo: parts[3] };
}

// ─── Visões admin (mapeadas ao contrato de UI existente) ────────────────────
export interface AdminPlano {
  id: string;
  nome: string;
  perfil: "contratante" | "empreiteiro";
  preco: number;
  totalAssinantes: number;
  assinantesAtivos: number;
  features: string[];
  ativo: boolean;
}

export async function listarPlanosAdmin(perfil: "contratante" | "empreiteiro"): Promise<AdminPlano[]> {
  const rows = await db
    .select({
      p: planos,
      total: sql<number>`COUNT(${assinaturas.id})::int`,
      ativos: sql<number>`COUNT(${assinaturas.id}) FILTER (WHERE ${assinaturas.status} = 'ativa')::int`,
    })
    .from(planos)
    .leftJoin(assinaturas, eq(assinaturas.planoId, planos.id))
    .where(sql`(${planos.persona} = ${perfil} OR ${planos.persona} = 'ambos')`)
    .groupBy(planos.id)
    .orderBy(planos.valorMensal);
  return rows.map(({ p, total, ativos }) => ({
    id: p.id,
    nome: p.nome,
    perfil,
    preco: Number(p.valorMensal),
    totalAssinantes: total,
    assinantesAtivos: ativos,
    features: p.features,
    ativo: p.ativo,
  }));
}

export interface AdminPlanoAssinante {
  id: string;
  nome: string;
  email: string;
  planoNome: string;
  perfil: "contratante" | "empreiteiro";
  dataAdesao: string;
  status: "ativo" | "inativo" | "trial" | "cancelado";
  valorMensal: number;
}

function mapAssinaturaStatus(s: string): AdminPlanoAssinante["status"] {
  if (s === "ativa") return "ativo";
  if (s === "cancelada" || s === "expirada") return "cancelado";
  return "inativo"; // inadimplente
}

export async function listarAssinantesAdmin(perfil: "contratante" | "empreiteiro"): Promise<AdminPlanoAssinante[]> {
  const rows = await db
    .select({
      a: assinaturas,
      userNome: users.name,
      userEmail: users.email,
      planoNome: planos.nome,
      valorMensal: planos.valorMensal,
    })
    .from(assinaturas)
    .innerJoin(users, eq(users.id, assinaturas.userId))
    .innerJoin(planos, eq(planos.id, assinaturas.planoId))
    .where(sql`(${planos.persona} = ${perfil} OR ${planos.persona} = 'ambos')`)
    .orderBy(desc(assinaturas.iniciadaEm));
  return rows.map(({ a, userNome, userEmail, planoNome, valorMensal }) => ({
    id: a.id,
    nome: userNome ?? "—",
    email: userEmail ?? "—",
    planoNome: planoNome ?? "—",
    perfil,
    dataAdesao: a.iniciadaEm.toISOString().slice(0, 10),
    status: mapAssinaturaStatus(a.status),
    valorMensal: Number(valorMensal),
  }));
}

export interface PlanosKpi {
  totalAssinantes: number;
  receitaMensal: number;
  churnMes: number;
  enterprise: number;
}

export async function getPlanosKpi(): Promise<PlanosKpi> {
  const [row] = await db
    .select({
      totalAtivos: sql<number>`COUNT(*) FILTER (WHERE ${assinaturas.status} = 'ativa')::int`,
      receita: sql<string>`COALESCE(SUM(${planos.valorMensal}) FILTER (WHERE ${assinaturas.status} = 'ativa'), 0)`,
      churn: sql<number>`COUNT(*) FILTER (WHERE ${assinaturas.status} = 'cancelada' AND ${assinaturas.canceladaEm} >= NOW() - INTERVAL '30 days')::int`,
      enterprise: sql<number>`COUNT(*) FILTER (WHERE ${assinaturas.status} = 'ativa' AND ${planos.tier} = 'enterprise')::int`,
    })
    .from(assinaturas)
    .innerJoin(planos, eq(planos.id, assinaturas.planoId));
  return {
    totalAssinantes: row?.totalAtivos ?? 0,
    receitaMensal: Number(row?.receita ?? 0),
    churnMes: row?.churn ?? 0,
    enterprise: row?.enterprise ?? 0,
  };
}

/** Atualiza campos editáveis de um plano (admin). */
export async function atualizarPlano(
  id: string,
  patch: { nome?: string; descricao?: string; valorMensal?: number; valorAnual?: number | null; ativo?: boolean; features?: string[] },
): Promise<typeof planos.$inferSelect | null> {
  const set: Record<string, unknown> = {};
  if (patch.nome !== undefined) set.nome = patch.nome;
  if (patch.descricao !== undefined) set.descricao = patch.descricao;
  if (patch.valorMensal !== undefined) set.valorMensal = String(patch.valorMensal);
  if (patch.valorAnual !== undefined) set.valorAnual = patch.valorAnual != null ? String(patch.valorAnual) : null;
  if (patch.ativo !== undefined) set.ativo = patch.ativo;
  if (patch.features !== undefined) set.features = patch.features;
  if (Object.keys(set).length === 0) {
    const [cur] = await db.select().from(planos).where(eq(planos.id, id)).limit(1);
    return cur ?? null;
  }
  const [row] = await db.update(planos).set(set).where(eq(planos.id, id)).returning();
  return row ?? null;
}

export { PLANS_CATALOG };
