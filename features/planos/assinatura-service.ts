import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturaEventos, assinaturas, clientes, empreiteiras, planos, users } from "@shared/db/schema";
import { getPlanCatalog, PLANS_CATALOG, type PlanoPersona, type PlanoTier } from "@shared/lib/plans-catalog";
import { criarLancamentoPlataforma } from "@features/financeiro/lancamentos-service";
import { getPaymentGateway } from "@features/planos/gateway";
import { dispararNotificacaoAssinaturaAdmin } from "@features/notificacoes/assinatura-admin-dispatcher";
import { criarNotificacao } from "@features/notificacoes/service";

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
  | { ok: true; kind: "activated"; assinaturaId: string; vigenciaEm: string }
  | { ok: true; kind: "redirect"; url: string; vigenciaEm: string }
  | { ok: false; code: "PLANO_INVALIDO" | "JA_ASSINANTE" }
  | { ok: false; code: "PERFIL_INCOMPLETO"; detail: string }
  | { ok: false; code: "INTERNAL_ERROR"; detail: string };

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
  /** Força o adapter a retornar redirect (pagamento pendente) em vez de ativar imediatamente. */
  pendingMode?: boolean;
}): Promise<CheckoutResult> {
  try {
    return await _iniciarCheckoutImpl(args);
  } catch (err) {
    console.error("[iniciarCheckout] erro inesperado:", err);
    return { ok: false, code: "INTERNAL_ERROR", detail: String(err) };
  }
}

async function _iniciarCheckoutImpl(args: {
  userId: string;
  planoId: string;
  ciclo?: "mensal" | "anual";
  pendingMode?: boolean;
}): Promise<CheckoutResult> {
  const [plano] = await db.select().from(planos).where(eq(planos.id, args.planoId)).limit(1);
  if (!plano || !plano.ativo) return { ok: false, code: "PLANO_INVALIDO" };

  // Já tem assinatura paga ativa? (free pode "assinar" um pago; pago→pago troca via cancelar antes.)
  const atual = await getAssinaturaAtiva(args.userId);
  if (atual && atual.planoId === args.planoId) return { ok: false, code: "JA_ASSINANTE" };

  const ciclo = args.ciclo ?? "mensal";
  const valor = ciclo === "anual" && plano.valorAnual ? Number(plano.valorAnual) : Number(plano.valorMensal);
  const gateway = getPaymentGateway();

  // Busca nome/email/role do usuário para gateways externos (ex: ASAAS) que precisam
  // criar/encontrar um customer. Falha silenciosa: campos opcionais no adapter.
  const [userRow] = await db
    .select({ name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);

  // Busca cpfCnpj do perfil do usuário — exigido pelo ASAAS para cobranças
  // recorrentes (boleto/PIX). Lookup por role para saber qual tabela consultar.
  let userCpfCnpj: string | undefined;
  if (userRow?.role === "contratante") {
    const [cr] = await db
      .select({ cnpjCpf: clientes.cnpjCpf })
      .from(clientes)
      .where(eq(clientes.userId, args.userId))
      .limit(1);
    userCpfCnpj = cr?.cnpjCpf ?? undefined;
  } else if (userRow?.role === "empreiteiro") {
    const [er] = await db
      .select({ cnpj: empreiteiras.cnpj })
      .from(empreiteiras)
      .where(eq(empreiteiras.userId, args.userId))
      .limit(1);
    userCpfCnpj = er?.cnpj ?? undefined;
  }

  // Gateways externos (ex: ASAAS) exigem cpfCnpj para cobranças recorrentes.
  // Se não localizado no perfil, interrompemos com erro acionável ao invés de
  // deixar o ASAAS retornar HTTP 400 com mensagem opaca.
  if (gateway.provider !== "manual" && !userCpfCnpj) {
    console.warn(`[checkout] cpfCnpj não encontrado para userId=${args.userId} — gateway=${gateway.provider}`);
    return {
      ok: false,
      code: "PERFIL_INCOMPLETO",
      detail: "CPF/CNPJ não cadastrado no seu perfil. Complete o cadastro antes de assinar.",
    };
  }

  // vigenciaEm: para upgrade/downgrade com assinatura ativa, o plano muda ao
  // final do ciclo atual (renovaEm). Para nova assinatura (sem ciclo prévio),
  // entra em vigor imediatamente (hoje). O ASAAS gerencia o calendário de
  // cobranças/proration — isso é configuração do plano no painel ASAAS (OOS).
  const vigenciaEm = (atual?.renovaEm ?? new Date()).toISOString();

  // Para gateways externos (ex: ASAAS), NÃO cancelamos a assinatura anterior
  // antes de criar o checkout — o checkout é apenas um link de pagamento, não
  // uma assinatura. O cancelamento ocorre de forma segura no webhook handler
  // APÓS confirmação de pagamento (aplicarEventoWebhook). Cancelar antes seria
  // arriscado: se o checkout falhar, o usuário perde a assinatura atual.

  const result = await gateway.createCheckout({
    userId: args.userId,
    planoId: plano.id,
    tier: plano.tier as PlanoTier,
    ciclo,
    valor,
    successUrl: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/planos/sucesso` : undefined,
    userEmail: userRow?.email ?? undefined,
    userName: userRow?.name ?? undefined,
    userCpfCnpj,
    pendingMode: args.pendingMode,
  });

  if (result.kind === "redirect") {
    // Notifica admins e o usuário que o checkout foi iniciado (gateway externo).
    // A confirmação definitiva virá via webhook após o pagamento.
    void (async () => {
      try {
        const [planoRow] = await db
          .select({ nome: planos.nome })
          .from(planos)
          .where(eq(planos.id, args.planoId))
          .limit(1);
        if (userRow && planoRow) {
          await dispararNotificacaoAssinaturaAdmin({
            tipo: "checkout",
            userNome: userRow.name ?? "—",
            userEmail: userRow.email ?? "—",
            planoNome: planoRow.nome,
            ciclo,
            descricaoOverride: `${userRow.name ?? userRow.email} iniciou checkout do plano ${planoRow.nome} (${ciclo}) via gateway externo. Aguardando confirmação de pagamento.`,
          });
          await criarNotificacao({
            userId: args.userId,
            tipo: "lembrete",
            titulo: `Conclua o pagamento para ativar o plano ${planoRow.nome}`,
            descricao: `Você foi redirecionado para o pagamento. Assim que confirmado, o plano ${planoRow.nome} será ativado automaticamente.`,
            href: null,
          });
        }
      } catch {
        // fire-and-forget
      }
    })();
    return { ok: true, kind: "redirect", url: result.url, vigenciaEm };
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

  // Notifica admins + o próprio usuário (fire-and-forget).
  void (async () => {
    try {
      const [uRow] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, args.userId))
        .limit(1);
      const [planoRow] = await db
        .select({ nome: planos.nome })
        .from(planos)
        .where(eq(planos.id, args.planoId))
        .limit(1);
      if (uRow && planoRow) {
        await dispararNotificacaoAssinaturaAdmin({
          tipo: "checkout",
          userNome: uRow.name ?? "—",
          userEmail: uRow.email ?? "—",
          planoNome: planoRow.nome,
          ciclo,
        });
      }

      // Notificação in-app para o próprio usuário sobre troca ou nova assinatura.
      const titulo = atual
        ? `Plano alterado para ${plano.nome}`
        : `Bem-vindo ao plano ${plano.nome}`;
      const descricao = atual
        ? `Seu plano foi atualizado com sucesso. Os limites do plano ${plano.nome} já estão em vigor.`
        : `Sua assinatura do plano ${plano.nome} (${ciclo}) foi ativada com sucesso.`;
      await criarNotificacao({
        userId: args.userId,
        tipo: "sucesso",
        titulo,
        descricao,
        href: null,
      });
    } catch {
      // fire-and-forget: ignora erros
    }
  })();

  return { ok: true, kind: "activated", assinaturaId, vigenciaEm };
}

/** Cancela a assinatura ativa do usuário. Rebaixa para free no fim do ciclo. */
export async function cancelarAssinatura(userId: string): Promise<{ ok: boolean }> {
  const atual = await getAssinaturaAtiva(userId);
  if (!atual) return { ok: false };

  // Carrega nome/email antes da transação para o dispatcher.
  const [userRow] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const [planoRow] = await db
    .select({ nome: planos.nome })
    .from(planos)
    .where(eq(planos.id, atual.planoId))
    .limit(1);

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

  // Notifica admins (fire-and-forget).
  if (userRow && planoRow) {
    void dispararNotificacaoAssinaturaAdmin({
      tipo: "cancelamento",
      userNome: userRow.name ?? "—",
      userEmail: userRow.email ?? "—",
      planoNome: planoRow.nome,
    });
  }

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
  // Acumula notificações a disparar após o commit da transação.
  type NotifPayload = Parameters<typeof dispararNotificacaoAssinaturaAdmin>[0];
  let notifPayload: NotifPayload | null = null;
  // gatewaySubscriptionId da assinatura anterior a cancelar no gateway pós-commit.
  let antigaGatewaySubIdToCancel: string | null = null;

  const result = await db.transaction(async (tx) => {
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
        .select({ id: assinaturas.id, userId: assinaturas.userId, planoId: assinaturas.planoId, status: assinaturas.status, ciclo: assinaturas.ciclo, renovaEm: assinaturas.renovaEm })
        .from(assinaturas)
        .where(eq(assinaturas.gatewaySubscriptionId, evt.gatewaySubscriptionId))
        .limit(1);
      if (a) {
        assinaturaId = a.id;
        if (evt.type === "payment_succeeded") {
          // Pagamento confirmado (ex: cliente pagou boleto/pix em atraso).
          // Reativa a assinatura se estava inadimplente, expirada OU
          // pendente_reativacao (estado de limbo do job de downgrade enquanto
          // consulta o gateway) e atualiza o tier do usuário.
          if (a.status === "inadimplente" || a.status === "expirada" || a.status === "pendente_reativacao") {
            // Preserve the original billing anchor: if the existing renovaEm is
            // within 30 days in the past (short overdue window), bump it by one
            // cycle from that date rather than from today. This prevents annual
            // subscribers from silently losing up to 11 months when they pay late.
            const now = new Date();
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
            const base =
              a.renovaEm && a.renovaEm.getTime() >= now.getTime() - THIRTY_DAYS_MS
                ? new Date(a.renovaEm)
                : now;
            const renova = new Date(base);
            if (a.ciclo === "anual") renova.setFullYear(renova.getFullYear() + 1);
            else renova.setMonth(renova.getMonth() + 1);
            await tx.update(assinaturas).set({ status: "ativa", renovaEm: renova }).where(eq(assinaturas.id, a.id));
            const [plano] = await tx.select({ nome: planos.nome, tier: planos.tier }).from(planos).where(eq(planos.id, a.planoId)).limit(1);
            if (plano) {
              await tx.update(users).set({ plano: plano.tier, planoStartedAt: new Date() }).where(eq(users.id, a.userId));
            }
            // Prepara notificação de reativação (disparo pós-commit).
            const [userRow] = await tx.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, a.userId)).limit(1);
            if (userRow && plano) {
              notifPayload = { tipo: "reativacao", userNome: userRow.name ?? "—", userEmail: userRow.email ?? "—", planoNome: plano.nome };
            }
            console.info(`[asaas] assinatura reativada após pagamento: assinaturaId=${a.id} userId=${a.userId}`);
          }
        } else if (evt.type === "payment_failed") {
          await tx.update(assinaturas).set({ status: "inadimplente" }).where(eq(assinaturas.id, a.id));
          // Prepara notificação de inadimplência.
          const [plano] = await tx.select({ nome: planos.nome }).from(planos).where(eq(planos.id, a.planoId)).limit(1);
          const [userRow] = await tx.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, a.userId)).limit(1);
          if (userRow && plano) {
            notifPayload = { tipo: "inadimplente", userNome: userRow.name ?? "—", userEmail: userRow.email ?? "—", planoNome: plano.nome };
          }
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
          // Guarda o gatewaySubscriptionId da assinatura anterior para cancelar
          // no gateway APÓS o commit da transação (seguro: nova assinatura já salva).
          const [antigaAssinatura] = await tx
            .select({ gatewaySubscriptionId: assinaturas.gatewaySubscriptionId })
            .from(assinaturas)
            .where(and(eq(assinaturas.userId, userId), eq(assinaturas.status, "ativa")))
            .limit(1);
          antigaGatewaySubIdToCancel = antigaAssinatura?.gatewaySubscriptionId ?? null;

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

          // Prepara notificação admin de nova assinatura via webhook.
          const [userRow] = await tx.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
          if (userRow) {
            notifPayload = { tipo: "checkout", userNome: userRow.name ?? "—", userEmail: userRow.email ?? "—", planoNome: plano.nome, ciclo: ciclo as "mensal" | "anual" };
          }

          // Notificação in-app ao próprio usuário confirmando ativação do plano.
          void criarNotificacao({
            userId,
            tipo: "sucesso",
            titulo: `Plano ${plano.nome} ativado`,
            descricao: `Pagamento confirmado. O plano ${plano.nome} (${ciclo}) está ativo e seus limites já foram atualizados.`,
            href: null,
          }).catch(() => {
            // fire-and-forget: não bloqueia processamento do webhook
          });

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

  // Dispara notificação admin pós-commit (fire-and-forget).
  if (result.processed && notifPayload) {
    void dispararNotificacaoAssinaturaAdmin(notifPayload);
  }

  // Cancela a assinatura anterior no gateway pós-commit (fire-and-forget).
  // Feito APÓS o commit para garantir que a nova assinatura já foi persistida antes
  // de cancelar a anterior — elimina o risco de o usuário perder o plano atual
  // caso o checkout ou a criação da nova assinatura falhem.
  if (result.processed && antigaGatewaySubIdToCancel) {
    void getPaymentGateway()
      .cancelSubscription(antigaGatewaySubIdToCancel)
      .catch((err) => {
        console.warn("[webhook] falha ao cancelar assinatura anterior no gateway:", err);
      });
  }

  return result;
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
