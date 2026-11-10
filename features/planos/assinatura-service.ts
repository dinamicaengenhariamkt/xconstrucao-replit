import { and, desc, eq, inArray, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturaEventos, assinaturas, clientes, empreiteiras, financeiro, planos, users } from "@shared/db/schema";
import { getPlanCatalog, PLANS_CATALOG, type PlanoPersona, type PlanoTier } from "@shared/lib/plans-catalog";
import { criarLancamentoPlataforma } from "@features/financeiro/lancamentos-service";
import { ORIGEM_ESTORNO_MENSALIDADE_XGESTAO, ORIGEM_MENSALIDADE_XGESTAO } from "@features/xgestao/lib/receita";
import { gatewayDaAssinatura, getPaymentGateway } from "@features/planos/gateway";
import { dispararNotificacaoAssinaturaAdmin } from "@features/notificacoes/assinatura-admin-dispatcher";
import { criarNotificacao } from "@features/notificacoes/service";
import { XGESTAO_PLANO_SUCESSO } from "@features/xgestao/routes";
import { expirarTestesVencidos, TESTE_PROVIDER } from "@features/xgestao/teste/server/teste-service";
import { situacaoPlanoXgestao } from "@features/xgestao/server/plano-empresa";
import { acessoAteAoCancelar, primeiraCobrancaAoAssinar, somarMeses } from "@features/xgestao/lib/acesso-plano";
import { hojeSaoPaulo } from "@features/xgestao/admin/lib/data-sp";
import { anualDisponivelXgestao, cicloDaAssinatura, mesesDoCiclo, valorDoCiclo } from "@features/xgestao/lib/ciclo-plano";
import { xgestaoAnualAtivo } from "@features/xgestao/server/anual";
import {
  documentoDoUsuario,
  documentoUsadoEmOutraConta,
  gravarDocumentoNaAssinatura,
  registrarTentativaNegada,
} from "@features/xgestao/server/documento-antiabuso";
import {
  cancelarTrocasPendentes,
  lockTrocaUsuario,
  marcarSubidasQuitadas,
  restaurarAposNovaAssinatura,
  reverterTrocasAoCancelar,
  sincronizarCobrancaPendente,
  temDiferencaPendente,
} from "@features/xgestao/server/troca-marcas";
import { decidirEstornoDuplicado } from "@features/planos/lib/estorno-duplicado";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface LimitesPlano {
  [key: string]: number;
}

/**
 * Limites efetivos do usuário. A persona pode ser explícita para produtos
 * adicionais, como xgestão, pois ela não pode ser inferida de `users.role`.
 * Os limites aplicados continuam no catálogo compartilhado para preservar os
 * gates existentes; preço e conteúdo comercial são lidos da tabela de planos.
 */
export async function getLimitesUsuario(
  userId: string,
  tx?: DbOrTx,
  personaExplicita?: PlanoPersona,
): Promise<LimitesPlano> {
  const client = (tx ?? db) as typeof db;
  const [u] = await client.select({ plano: users.plano, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  const persona: PlanoPersona = personaExplicita ?? (u?.role === "empreiteiro" ? "empreiteiro" : "contratante");
  let tier = (u?.plano ?? "free") as PlanoTier;
  if (persona === "xgestao") {
    // Mesma regra da escrita (tolerância do teste, cancelamento agendado e
    // carência de inadimplência), para cota e bloqueio nunca discordarem.
    const situacao = await situacaoPlanoXgestao(userId, client);
    if (!situacao.tier) return { obrasAtivas: 0, pessoasEmpresa: 0, linksPorObra: 0, valoresPublicos: 0 };
    tier = situacao.tier;
  }
  return getPlanCatalog(persona, tier).limites;
}

/** Limite de um recurso específico (ex: "propostasMes", "obrasAbertas"). */
export async function getLimiteRecurso(
  userId: string,
  recurso: string,
  tx?: DbOrTx,
  personaExplicita?: PlanoPersona,
): Promise<number | null> {
  const limites = await getLimitesUsuario(userId, tx, personaExplicita);
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

export async function getAssinaturaAtiva(
  userId: string,
  persona?: PlanoPersona,
): Promise<(typeof assinaturas.$inferSelect & { tier: PlanoTier }) | null> {
  const [row] = await db
    .select({ a: assinaturas, tier: planos.tier })
    .from(assinaturas)
    .innerJoin(planos, eq(planos.id, assinaturas.planoId))
    .where(and(
      eq(assinaturas.userId, userId),
      eq(assinaturas.status, "ativa"),
      ...(persona ? [eq(assinaturas.persona, persona)] : []),
    ))
    .limit(1);
  return row ? { ...row.a, tier: row.tier as PlanoTier } : null;
}

export async function listarPlanos(persona?: PlanoPersona): Promise<typeof planos.$inferSelect[]> {
  const conds = [eq(planos.ativo, true)];
  if (persona) conds.push(sql`(${planos.persona} = ${persona} OR ${planos.persona} = 'ambos')`);
  if (persona === "xgestao") conds.push(sql`${planos.tier} IN ('basic','basic_plus','premium')`);
  const rows = await db.select().from(planos).where(and(...conds)).orderBy(planos.valorMensal);
  if (persona !== "xgestao") return rows;

  // O conteúdo comercial fica persistido, mas a exceção temporária do
  // Freemium precisa aparecer imediatamente sem alterar o catálogo no banco.
  return rows.map((row) =>
    row.persona === "xgestao" && row.tier === "free"
      ? { ...row, features: getPlanCatalog("xgestao", "free").features }
      : row,
  );
}

// ─── Checkout / ativação ────────────────────────────────────────────────────
export type CheckoutResult =
  | { ok: true; kind: "activated"; assinaturaId: string; vigenciaEm: string; primeiraCobrancaEm?: string }
  | { ok: true; kind: "redirect"; url: string; vigenciaEm: string; primeiraCobrancaEm?: string }
  | { ok: false; code: "PLANO_INVALIDO" | "JA_ASSINANTE" | "CICLO_INVALIDO" }
  /** XG50 — xgestão com plano pago ativo: muda pela troca de plano, não por outro checkout. */
  | { ok: false; code: "USAR_TROCA" }
  | { ok: false; code: "PERFIL_INCOMPLETO"; detail: string }
  | { ok: false; code: "GATEWAY_ERROR"; detail: string }
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
  /** Persona validada pela rota para produtos adicionais, como xgestão. */
  persona?: PlanoPersona;
  /** Força o adapter a retornar redirect (pagamento pendente) em vez de ativar imediatamente. */
  pendingMode?: boolean;
}): Promise<CheckoutResult> {
  try {
    return await _iniciarCheckoutImpl(args);
  } catch (err) {
    console.error("[iniciarCheckout] erro inesperado:", err);
    if (err instanceof Error && err.message.startsWith("[asaas]")) {
      return { ok: false, code: "GATEWAY_ERROR", detail: err.message };
    }
    return { ok: false, code: "INTERNAL_ERROR", detail: String(err) };
  }
}

/**
 * URL absoluta de retorno do checkout xgestão (XG33 AJ-01). Em produção vem de
 * `NEXT_PUBLIC_BASE_URL`; no ambiente de desenvolvimento do Replit essa variável
 * não existe, e sem reserva o gateway caía no domínio fixo do marketplace. O
 * `NEXTAUTH_URL` de desenvolvimento aponta para o domínio do próprio Repl.
 */
function xgestaoUrl(path: string): string | undefined {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXTAUTH_URL;
  return base ? `${base.replace(/\/$/, "")}${path}` : undefined;
}

async function _iniciarCheckoutImpl(args: {
  userId: string;
  planoId: string;
  ciclo?: "mensal" | "anual";
  persona?: PlanoPersona;
  pendingMode?: boolean;
}): Promise<CheckoutResult> {
  const [plano] = await db.select().from(planos).where(eq(planos.id, args.planoId)).limit(1);
  if (!plano || !plano.ativo) return { ok: false, code: "PLANO_INVALIDO" };
  if (args.persona && plano.persona !== args.persona && plano.persona !== "ambos") {
    return { ok: false, code: "PLANO_INVALIDO" };
  }
  const personaAssinatura: PlanoPersona | null =
    plano.persona === "ambos" ? (args.persona ?? null) : plano.persona;
  if (!personaAssinatura) return { ok: false, code: "PLANO_INVALIDO" };
  if (personaAssinatura === "xgestao" && !["basic", "basic_plus", "premium"].includes(plano.tier)) {
    return { ok: false, code: "PLANO_INVALIDO" };
  }
  // XG50 — anual do xgestão só com `valor_anual` e a chave `xgestao.anualAtivo` ligada.
  if (args.ciclo === "anual" && (
    plano.valorAnual == null || !(Number(plano.valorAnual) > 0) ||
    (personaAssinatura === "xgestao" && !anualDisponivelXgestao(plano, await xgestaoAnualAtivo()))
  )) return { ok: false, code: "CICLO_INVALIDO" };

  // xgestão: grava antes os vencimentos preguiçosos (teste e cancelamento agendado).
  if (personaAssinatura === "xgestao") {
    await expirarTestesVencidos(args.userId);
    await encerrarCancelamentosVencidos(args.userId);
  }
  // Já tem assinatura paga ativa? (free pode "assinar" um pago; pago→pago troca via cancelar antes.)
  const atual = await getAssinaturaAtiva(args.userId, personaAssinatura);
  const emTesteXgestao = personaAssinatura === "xgestao" && atual?.gatewayProvider === TESTE_PROVIDER;
  const cancelamentoAgendado = personaAssinatura === "xgestao" && !emTesteXgestao && atual?.canceladaEm != null;
  // XG35 — quem está no teste grátis pode assinar o mesmo plano do teste; quem
  // cancelou e ainda está no período pago pode assinar de novo.
  if (atual && atual.planoId === args.planoId && !emTesteXgestao && !cancelamentoAgendado) {
    return { ok: false, code: "JA_ASSINANTE" };
  }
  // XG50 — xgestão com plano pago ativo (sem cancelamento agendado): outro
  // checkout criaria uma 2ª assinatura cobrando no gateway. Mudar de plano é
  // pela troca (proporcional, XG48). Inadimplente segue podendo assinar (PAG-06).
  if (personaAssinatura === "xgestao" && atual && !emTesteXgestao && !cancelamentoAgendado) {
    return { ok: false, code: "USAR_TROCA" };
  }

  // PAG-14 — xgestão aceita pessoa física ou jurídica: CPF ou CNPJ válido,
  // do campo da empresa ou do documento da conta. Lido antes do bônus (XG50).
  const documentoXgestao = personaAssinatura === "xgestao" ? await documentoDoUsuario(args.userId) : undefined;

  // XG43 — data da 1ª cobrança. No teste: +1 mês após o fim do teste (bônus),
  // uma vez por conta (10/11/2026). Com cancelamento agendado: no fim do
  // período em que o acesso ainda vale, sem cobrar em dobro.
  let primeiraCobrancaEm: Date | null = null;
  let fimTesteDoBonus: Date | null = null;
  if (personaAssinatura === "xgestao" && atual?.renovaEm && (emTesteXgestao || cancelamentoAgendado)) {
    // XG50 — bônus uma vez por conta E uma vez por CPF/CNPJ.
    let bonusJaUsado = true;
    if (emTesteXgestao) {
      const naConta = await bonusDoTesteJaUsado(args.userId);
      const noDocumento = !naConta && documentoXgestao
        ? await documentoUsadoEmOutraConta(documentoXgestao, args.userId, "bonus")
        : false;
      bonusJaUsado = naConta || noDocumento;
      if (noDocumento) {
        await registrarTentativaNegada({ userId: args.userId, tipo: "bonus_negado", assinaturaId: atual.id, motivo: "documento_em_outra_conta" });
      }
      // O teste desta conta passa a ficar ligado ao documento (some a brecha de
      // trocar o CPF/CNPJ do cadastro depois).
      await gravarDocumentoNaAssinatura(atual.id, documentoXgestao);
    }
    const calculo = primeiraCobrancaAoAssinar({
      fimTeste: emTesteXgestao ? atual.renovaEm : null,
      bonusJaUsado,
      acessoAte: cancelamentoAgendado ? atual.renovaEm : null,
    });
    primeiraCobrancaEm = calculo.primeiraCobrancaEm;
    if (calculo.comBonus) fimTesteDoBonus = atual.renovaEm;
  }
  const primeiraCobrancaIso = primeiraCobrancaEm?.toISOString();

  const ciclo = args.ciclo ?? "mensal";
  const valor = valorDoCiclo(plano, ciclo);
  const gateway = getPaymentGateway();

  // Busca nome/email/role do usuário para gateways externos (ex: ASAAS) que precisam
  // criar/encontrar um customer. Falha silenciosa: campos opcionais no adapter.
  const [userRow] = await db
    .select({
      name: users.name,
      email: users.email,
      role: users.role,
      asaasCustomerId: users.asaasCustomerId,
    })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);

  // Busca cpfCnpj do perfil do usuário — exigido pelo ASAAS para cobranças
  // recorrentes (boleto/PIX). Lookup por role para saber qual tabela consultar.
  let userCpfCnpj: string | undefined;
  if (personaAssinatura === "xgestao") {
    userCpfCnpj = documentoXgestao;
  } else if (userRow?.role === "empreiteiro") {
    const [er] = await db
      .select({ cnpj: empreiteiras.cnpj })
      .from(empreiteiras)
      .where(eq(empreiteiras.userId, args.userId))
      .limit(1);
    userCpfCnpj = er?.cnpj ?? undefined;
  } else if (userRow?.role === "contratante") {
    const [cr] = await db
      .select({ cnpjCpf: clientes.cnpjCpf })
      .from(clientes)
      .where(eq(clientes.userId, args.userId))
      .limit(1);
    userCpfCnpj = cr?.cnpjCpf ?? undefined;
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
    planoNome: plano.nome,
    successUrl: args.persona === "xgestao"
      ? xgestaoUrl(XGESTAO_PLANO_SUCESSO)
      : process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/planos/sucesso` : undefined,
    cancelUrl: args.persona === "xgestao"
      ? xgestaoUrl("/xgestao/configuracoes?tab=plano")
      : process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/${personaAssinatura}/planos` : undefined,
    userEmail: userRow?.email ?? undefined,
    userName: userRow?.name ?? undefined,
    userCpfCnpj,
    userAsaasCustomerId: userRow?.asaasCustomerId ?? undefined,
    pendingMode: args.pendingMode,
    primeiraCobrancaEm: primeiraCobrancaEm ?? undefined,
  });

  if (result.kind === "redirect") {
    // Persiste o customer ID resolvido pelo gateway (pode ter mudado se o ID
    // cacheado era de outro ambiente Asaas). Fire-and-forget: falha silenciosa,
    // não bloqueia o redirect — o checkout já foi criado no gateway e a URL deve
    // ser devolvida ao usuário mesmo que o cache local falhe.
    if (result.gatewayCustomerId && result.gatewayCustomerId !== userRow?.asaasCustomerId) {
      void db
        .update(users)
        .set({ asaasCustomerId: result.gatewayCustomerId })
        .where(eq(users.id, args.userId))
        .catch((e) => console.warn("[checkout] falha ao cachear asaasCustomerId:", e));
    }

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
    return {
      ok: true, kind: "redirect", url: result.url, vigenciaEm,
      ...(primeiraCobrancaIso ? { primeiraCobrancaEm: primeiraCobrancaIso } : {}),
    };
  }

  // Ativação imediata (adapter manual): persiste tudo numa transação.
  const assinaturaId = await db.transaction(async (tx) => {
    // Cancela qualquer assinatura anterior (troca de plano). No xgestão também
    // a inadimplente/pendente: a nova substitui a antiga (PAG-06).
    await substituirAssinaturasAnteriores(tx, args.userId, personaAssinatura);

    // Com bônus/período já pago, nada é cobrado agora: o ciclo vai até a 1ª cobrança.
    const renova = primeiraCobrancaEm ? new Date(primeiraCobrancaEm) : new Date();
    const renovaFinal = primeiraCobrancaEm ? renova : somarMeses(renova, mesesDoCiclo(ciclo));

    const [nova] = await tx
      .insert(assinaturas)
      .values({
        userId: args.userId,
        planoId: plano.id,
        persona: personaAssinatura,
        status: "ativa",
        ciclo,
        renovaEm: renovaFinal,
        gatewayProvider: gateway.provider,
        gatewayCustomerId: result.gatewayCustomerId ?? null,
        gatewaySubscriptionId: result.gatewaySubscriptionId ?? null,
        ...(personaAssinatura === "xgestao" ? {
          fimTesteEm: fimTesteDoBonus,
          // Cobrado agora = 1º pagamento; com 1ª cobrança futura, ainda não.
          primeiroPagamentoEm: !primeiraCobrancaEm && valor > 0 ? new Date() : null,
          documentoFiscal: documentoXgestao ?? null,
        } : {}),
      })
      .returning({ id: assinaturas.id });

    // users.plano segue sendo o tier legado do marketplace. xgestão resolve o
    // seu tier pela assinatura da própria persona, sem alterar suas cotas.
    if (personaAssinatura !== "xgestao") {
      await tx.update(users).set({ plano: plano.tier, planoStartedAt: new Date() }).where(eq(users.id, args.userId));
    } else {
      // XG48 — assinar um plano maior que o da última descida devolve a edição.
      await restaurarAposNovaAssinatura(tx, args.userId, plano.tier);
    }

    // Evento de checkout (idempotência por gatewaySubscriptionId).
    await tx.insert(assinaturaEventos).values({
      assinaturaId: nova.id,
      tipo: "checkout",
      gatewayEventId: result.gatewaySubscriptionId ? `checkout_${result.gatewaySubscriptionId}` : null,
      payloadJson: { planoId: plano.id, ciclo, valor, ...(primeiraCobrancaIso ? { primeiraCobrancaEm: primeiraCobrancaIso } : {}) },
    });

    // Receita no caixa (J09) — só se houver valor (free não gera lançamento) e
    // se algo foi cobrado agora: com 1ª cobrança futura não há receita ainda.
    if (valor > 0 && !primeiraCobrancaEm) {
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

  return {
    ok: true, kind: "activated", assinaturaId, vigenciaEm,
    ...(primeiraCobrancaIso ? { primeiraCobrancaEm: primeiraCobrancaIso } : {}),
  };
}

/**
 * XG43 — encerra os cancelamentos agendados do xgestão cujo período pago já
 * acabou. Preguiçoso e idempotente, como o vencimento do teste: a regra de
 * vigência já bloqueia antes desta escrita, que só deixa o histórico correto.
 */
export async function encerrarCancelamentosVencidos(userId?: string): Promise<number> {
  const encerradas = await db
    .update(assinaturas)
    .set({ status: "cancelada" })
    .where(and(
      eq(assinaturas.persona, "xgestao"),
      eq(assinaturas.status, "ativa"),
      ne(assinaturas.gatewayProvider, TESTE_PROVIDER),
      isNotNull(assinaturas.canceladaEm),
      lt(assinaturas.renovaEm, new Date()),
      ...(userId ? [eq(assinaturas.userId, userId)] : []),
    ))
    .returning({ id: assinaturas.id });
  if (encerradas.length > 0) {
    await db.insert(assinaturaEventos).values(
      encerradas.map((a) => ({ assinaturaId: a.id, tipo: "cancelamento_efetivado", payloadJson: {} })),
    );
  }
  return encerradas.length;
}

/** Cancela a assinatura ativa da persona solicitada. */
export async function cancelarAssinatura(
  userId: string,
  persona?: PlanoPersona,
  /**
   * CRM-03 — motivo opcional informado ao cancelar (já normalizado pela rota).
   * Só gravado no xgestão; o marketplace ignora. Não muda a regra de acesso.
   */
  motivo?: { motivo: string | null; texto: string | null },
): Promise<{ ok: boolean; acessoAte?: string | null; code?: "TROCA_EM_ANDAMENTO" }> {
  if (persona === "xgestao") return cancelarAssinaturaXgestao(userId, motivo);
  const atual = await getAssinaturaAtiva(userId, persona);
  if (!atual) return { ok: false };
  if (atual.persona === "xgestao") return cancelarAssinaturaXgestao(userId, motivo);

  const [userRow] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  const [planoRow] = await db.select({ nome: planos.nome }).from(planos).where(eq(planos.id, atual.planoId)).limit(1);

  const gateway = getPaymentGateway();
  await gateway.cancelSubscription(atual.gatewaySubscriptionId);

  await db.transaction(async (tx) => {
    await tx.update(assinaturas).set({ status: "cancelada", canceladaEm: new Date() }).where(eq(assinaturas.id, atual.id));
    await tx.update(users).set({ plano: "free" }).where(eq(users.id, userId));
    await tx.insert(assinaturaEventos).values({ assinaturaId: atual.id, tipo: "cancelamento", payloadJson: {} });
  });

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
 * xgestão. REV-09: com o mesmo lock da troca de plano (`lockTrocaUsuario`) e a
 * linha da assinatura relida com `FOR UPDATE`, cancelar e trocar ao mesmo
 * tempo não se cruzam: um espera o outro e relê o estado. Troca ainda no meio
 * da chamada ao gateway (`pendente_gateway`) faz o cancelamento esperar a
 * próxima tentativa (409), em vez de cancelar no meio dela.
 *
 * O DELETE no gateway roda dentro da transação, com o lock: falhou, nada muda
 * aqui (o assinante tenta de novo). O lock é por titular, então segura só ele.
 */
async function cancelarAssinaturaXgestao(
  userId: string,
  motivo?: { motivo: string | null; texto: string | null },
): Promise<{ ok: boolean; acessoAte?: string | null; code?: "TROCA_EM_ANDAMENTO" }> {
  await encerrarCancelamentosVencidos(userId);

  const [userRow] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);

  type Resultado = { ok: boolean; acessoAte?: string | null; code?: "TROCA_EM_ANDAMENTO"; planoNome?: string };
  const resultado: Resultado = await db.transaction(async (tx): Promise<Resultado> => {
    await lockTrocaUsuario(tx, userId);
    const [linha] = await tx
      .select({ a: assinaturas, planoNome: planos.nome })
      .from(assinaturas)
      .innerJoin(planos, eq(planos.id, assinaturas.planoId))
      .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, "xgestao"), eq(assinaturas.status, "ativa")))
      .limit(1)
      .for("update", { of: assinaturas });
    if (!linha) return { ok: false };
    const atual = linha.a;
    // XG43 — teste grátis não se cancela (vence sozinho), e cancelar de novo não
    // gera outro evento nem outra chamada ao gateway.
    if (atual.gatewayProvider === TESTE_PROVIDER) return { ok: false };
    if (atual.canceladaEm) return { ok: true, acessoAte: atual.renovaEm?.toISOString() ?? null };

    const emAndamento = await tx.execute(sql`
      SELECT 1 FROM assinatura_trocas WHERE user_id = ${userId} AND status = 'pendente_gateway' LIMIT 1
    `).catch(() => ({ rows: [] as unknown[] }));
    if (emAndamento.rows.length > 0) return { ok: false, code: "TROCA_EM_ANDAMENTO" };

    // XG43 — o acesso segue até o fim do período já pago. Regra de 10/11/2026:
    // com o mês bônus e sem 1º pagamento, só até o fim do teste + 24h (ou 24h
    // após cancelar, se o teste já acabou). Ver `acessoAteAoCancelar`.
    const acessoAte = acessoAteAoCancelar(atual);
    const agendar = acessoAte !== null;
    const colunasMotivo = motivo
      ? { motivoCancelamento: motivo.motivo, motivoCancelamentoTexto: motivo.texto }
      : {};

    await gatewayDaAssinatura(atual.gatewayProvider).cancelSubscription(atual.gatewaySubscriptionId);

    // XG48 — subida cuja fatura com a diferença não foi paga volta ao plano
    // anterior pelo resto do período; descida agendada é cancelada.
    await reverterTrocasAoCancelar(tx, atual.id, userId);
    await tx
      .update(assinaturas)
      // `renovaEm` passa a ser o fim do acesso: a regra de vigência e o
      // encerramento preguiçoso (`encerrarCancelamentosVencidos`) leem dele.
      .set(agendar
        ? { canceladaEm: new Date(), renovaEm: acessoAte, ...colunasMotivo }
        : { status: "cancelada", canceladaEm: new Date(), ...colunasMotivo })
      .where(eq(assinaturas.id, atual.id));
    await tx.insert(assinaturaEventos).values({
      assinaturaId: atual.id,
      userId,
      tipo: agendar ? "cancelamento_agendado" : "cancelamento",
      payloadJson: {
        ...(agendar
          ? {
            acessoAte: acessoAte!.toISOString(),
            ...(acessoAte!.getTime() !== atual.renovaEm?.getTime()
              ? { renovaEmAnterior: atual.renovaEm?.toISOString() ?? null, motivo: "bonus_sem_primeiro_pagamento" }
              : {}),
          }
          : {}),
        // CRM-03 — cópia no histórico; a fonte das contagens é a coluna.
        ...(motivo && (motivo.motivo || motivo.texto)
          ? { motivoCancelamento: motivo.motivo, motivoCancelamentoTexto: motivo.texto }
          : {}),
      },
    });
    return { ok: true, acessoAte: agendar ? acessoAte!.toISOString() : undefined, planoNome: linha.planoNome };
  });

  if (resultado.ok && resultado.planoNome && userRow) {
    void dispararNotificacaoAssinaturaAdmin({
      tipo: "cancelamento",
      userNome: userRow.name ?? "—",
      userEmail: userRow.email ?? "—",
      planoNome: resultado.planoNome,
    });
  }
  const { planoNome: _planoNome, ...publico } = resultado;
  return publico;
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
  /** XG43 — vencimento da cobrança (YYYY-MM-DD) em eventos de pagamento. */
  dueDate?: string;
  /** XG45 — id do pagamento no gateway (chave da mensalidade no caixa). */
  paymentId?: string;
  /** CRM-11 — em `payment_refunded`: devolução pedida ou contestação no cartão. */
  motivo?: "estorno" | "chargeback";
}): Promise<{ processed: boolean }> {
  // Acumula notificações a disparar após o commit da transação.
  type NotifPayload = Parameters<typeof dispararNotificacaoAssinaturaAdmin>[0];
  let notifPayload: NotifPayload | null = null;
  // gatewaySubscriptionIds a cancelar no gateway pós-commit (assinaturas
  // substituídas, ou encerradas por estorno).
  const gatewaySubIdsToCancel: string[] = [];
  // XG48 — cobrança nova de assinatura com diferença proporcional a somar.
  let sincronizarAssinaturaId: string | null = null;
  // XG50 — assinatura do gateway duplicada (2º checkout com plano pago ativo):
  // a do próprio evento é cancelada no gateway depois do commit.
  let cancelarSubDoEvento = false;
  let duplicadaDe: string | null = null;
  let pagamentoDuplicado = false;
  // 10/11/2026 — o pagamento da duplicada sai por estorno automático, pós-commit.
  let estornarDuplicado = false;
  let donoDuplicada: string | null = null;

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
        .select({ id: assinaturas.id, userId: assinaturas.userId, planoId: assinaturas.planoId, persona: assinaturas.persona, status: assinaturas.status, ciclo: assinaturas.ciclo, renovaEm: assinaturas.renovaEm, canceladaEm: assinaturas.canceladaEm, gatewaySubscriptionId: assinaturas.gatewaySubscriptionId })
        .from(assinaturas)
        .where(eq(assinaturas.gatewaySubscriptionId, evt.gatewaySubscriptionId))
        .limit(1);
      if (a) {
        assinaturaId = a.id;
        if (evt.type === "payment_succeeded" && a.status === "ativa" && a.persona === "xgestao") {
          // XG43 — renovação mensal: o período pago passa a ir até o vencimento
          // pago + 1 ciclo. `max` torna a escrita idempotente entre CONFIRMED e
          // RECEIVED do mesmo pagamento, que chegam com ids de evento distintos.
          const vencimento = dataDoVencimento(evt.dueDate);
          if (vencimento) {
            const ate = somarMeses(vencimento, a.ciclo === "anual" ? 12 : 1);
            if (!a.renovaEm || ate.getTime() > a.renovaEm.getTime()) {
              await tx.update(assinaturas).set({ renovaEm: ate }).where(eq(assinaturas.id, a.id));
            }
          }
          await marcarPrimeiroPagamento(tx, a.id);
          // XG45 — renovação e 1ª cobrança adiada (bônus) também são receita.
          // Chave = id do pagamento: CONFIRMED + RECEIVED e retry somam uma vez só.
          await registrarMensalidadeXgestao(tx, { userId: a.userId, planoId: a.planoId, paymentId: evt.paymentId, valor: evt.valor, ciclo: a.ciclo });
          // XG48 — fatura com a diferença paga: a subida não volta mais atrás.
          await marcarSubidasQuitadas(tx, a.id, evt.paymentId);
        } else if (evt.type === "payment_created" && a.persona === "xgestao" && a.status === "ativa") {
          // XG48 — o Asaas gerou a próxima cobrança: soma a diferença pendente.
          if (await temDiferencaPendente(tx, a.id)) sincronizarAssinaturaId = a.id;
        } else if (evt.type === "payment_succeeded") {
          // Pagamento confirmado (ex: cliente pagou boleto/pix em atraso).
          // Reativa a assinatura se estava inadimplente, expirada OU
          // pendente_reativacao (estado de limbo do job de downgrade enquanto
          // consulta o gateway) e atualiza o tier do usuário.
          // XG50 — no xgestão, o RECEIVED atrasado de um pagamento já contado
          // (o CONFIRMED dele já entrou no caixa) não é pagamento novo: não
          // reativa nem avança `renovaEm` de quem ficou inadimplente depois.
          const pagamentoRepetido = a.persona === "xgestao" && await pagamentoJaContado(tx, evt.paymentId);
          if (!pagamentoRepetido && (a.status === "inadimplente" || a.status === "expirada" || a.status === "pendente_reativacao")) {
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
            let renova = somarMeses(base, mesesDoCiclo(a.ciclo));
            // XG50 — xgestão: o pagamento libera o período DA cobrança paga
            // (vencimento + 1 ciclo), sem pular nem repetir mês.
            const vencimentoPago = a.persona === "xgestao" ? dataDoVencimento(evt.dueDate) : null;
            if (vencimentoPago) {
              renova = somarMeses(vencimentoPago, mesesDoCiclo(a.ciclo));
              if (a.renovaEm && a.renovaEm.getTime() > renova.getTime()) renova = a.renovaEm;
            }
            await tx.update(assinaturas).set({ status: "ativa", renovaEm: renova }).where(eq(assinaturas.id, a.id));
            if (a.persona === "xgestao") {
              // XG45 — pagamento em atraso que reativa também entra no caixa.
              await registrarMensalidadeXgestao(tx, { userId: a.userId, planoId: a.planoId, paymentId: evt.paymentId, valor: evt.valor, ciclo: a.ciclo });
              await marcarPrimeiroPagamento(tx, a.id);
              await marcarSubidasQuitadas(tx, a.id, evt.paymentId);
            }
            const [plano] = await tx.select({ nome: planos.nome, tier: planos.tier }).from(planos).where(eq(planos.id, a.planoId)).limit(1);
            if (plano && a.persona !== "xgestao") {
              await tx.update(users).set({ plano: plano.tier, planoStartedAt: new Date() }).where(eq(users.id, a.userId));
            }
            // Prepara notificação de reativação (disparo pós-commit).
            const [userRow] = await tx.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, a.userId)).limit(1);
            if (userRow && plano) {
              notifPayload = { tipo: "reativacao", userNome: userRow.name ?? "—", userEmail: userRow.email ?? "—", planoNome: plano.nome };
            }
            console.info(`[asaas] assinatura reativada após pagamento: assinaturaId=${a.id} userId=${a.userId}`);
          }
        } else if (evt.type === "payment_failed" || evt.type === "payment_deleted") {
          // PAG-03 — nunca reviver assinatura encerrada: cancelar/trocar faz o
          // Asaas apagar a cobrança pendente, e isso chegava como falha e
          // voltava a assinatura cancelada para inadimplente (todas as personas).
          const encerrada = a.status === "cancelada" || a.status === "expirada";
          // xgestão: cobrança apagada não é inadimplência, e o cancelamento
          // agendado segue valendo até `renovaEm`. Marketplace mantém o
          // comportamento anterior para cobrança apagada de assinatura ativa.
          const xgestaoSemInadimplencia = a.persona === "xgestao" && (
            evt.type === "payment_deleted" || (a.status === "ativa" && a.canceladaEm !== null)
            // XG50 — OVERDUE que chega depois do CONFIRMED do mesmo pagamento.
            || await pagamentoJaContado(tx, evt.paymentId)
          );
          if (!encerrada && !xgestaoSemInadimplencia) {
            await tx.update(assinaturas).set({ status: "inadimplente" }).where(eq(assinaturas.id, a.id));
            // Prepara notificação de inadimplência.
            const [plano] = await tx.select({ nome: planos.nome }).from(planos).where(eq(planos.id, a.planoId)).limit(1);
            const [userRow] = await tx.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, a.userId)).limit(1);
            if (userRow && plano) {
              notifPayload = { tipo: "inadimplente", userNome: userRow.name ?? "—", userEmail: userRow.email ?? "—", planoNome: plano.nome };
            }
          }
        } else if (evt.type === "payment_refunded") {
          // PAG-04 — estorno/chargeback. Só o xgestão age; o marketplace segue
          // ignorando (o evento fica só registrado).
          if (a.persona === "xgestao") {
            if (a.status !== "cancelada" && a.status !== "expirada") {
              // Encerra na hora: o acesso cai para somente leitura.
              await tx.update(assinaturas).set({ status: "cancelada", canceladaEm: new Date() }).where(eq(assinaturas.id, a.id));
              if (a.gatewaySubscriptionId) gatewaySubIdsToCancel.push(a.gatewaySubscriptionId);
              const [plano] = await tx.select({ nome: planos.nome }).from(planos).where(eq(planos.id, a.planoId)).limit(1);
              const [userRow] = await tx.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, a.userId)).limit(1);
              if (userRow && plano) {
                notifPayload = {
                  tipo: "cancelamento", userNome: userRow.name ?? "—", userEmail: userRow.email ?? "—", planoNome: plano.nome,
                  descricaoOverride: `Assinatura xgestão ${plano.nome} de ${userRow.name ?? userRow.email} encerrada por estorno ou chargeback do pagamento.`,
                };
              }
            }
            await registrarEstornoMensalidadeXgestao(tx, { userId: a.userId, planoId: a.planoId, paymentId: evt.paymentId, valor: evt.valor });
            // XG48 — estorno durante troca pendente: a troca é cancelada.
            await cancelarTrocasPendentes(tx, a.id, "estorno");
          }
        } else if (
          evt.type === "subscription_canceled" && a.persona === "xgestao" && a.status === "ativa"
          && a.canceladaEm && a.renovaEm && a.renovaEm.getTime() > Date.now()
        ) {
          // XG43 — eco do cancelamento pedido pelo assinante: o período pago
          // continua; `encerrarCancelamentosVencidos` encerra em `renovaEm`.
        } else if (evt.type === "subscription_canceled") {
          await tx.update(assinaturas).set({ status: "cancelada", canceladaEm: new Date() }).where(eq(assinaturas.id, a.id));
          if (a.persona !== "xgestao") {
            await tx.update(users).set({ plano: "free" }).where(eq(users.id, a.userId));
          } else {
            // XG48 — cancelada pelo painel do Asaas: troca pendente cancelada.
            await cancelarTrocasPendentes(tx, a.id, "cancelada_no_gateway");
          }
        }
      }
    }

    // Fluxo redirect (ex: ASAS): primeiro pagamento confirmado sem assinatura pré-existente.
    // O externalReference "xconstrucao|userId|planoId|ciclo" permite criar a assinatura agora.
    // XG43 — assinatura do xgestão com a 1ª cobrança no futuro (bônus de +1 mês
    // do teste, ou nova assinatura dentro do período já pago). O Asaas só cria a
    // cobrança futura depois que o checkout foi concluído com cartão válido, e o
    // pagamento só chega no vencimento: a assinatura vale desde já até lá.
    if (!assinaturaId && evt.type === "payment_created" && evt.externalReference) {
      const parsed = parseExternalRef(evt.externalReference);
      const vencimento = dataDoVencimento(evt.dueDate);
      if (parsed && vencimento && vencimento.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
        const { userId, planoId, ciclo } = parsed;
        const [plano] = await tx.select().from(planos).where(eq(planos.id, planoId)).limit(1);
        const [atual] = plano?.ativo && plano.persona === "xgestao"
          ? await tx
            .select({ id: assinaturas.id, provider: assinaturas.gatewayProvider, renovaEm: assinaturas.renovaEm, canceladaEm: assinaturas.canceladaEm, gatewaySubscriptionId: assinaturas.gatewaySubscriptionId })
            .from(assinaturas)
            .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, "xgestao"), eq(assinaturas.status, "ativa")))
            .limit(1)
          : [];
        // Só quem estava no teste ou com cancelamento agendado tem 1ª cobrança futura.
        const elegivel = atual && (
          atual.provider === TESTE_PROVIDER
          || (atual.canceladaEm !== null && atual.renovaEm !== null && atual.renovaEm.getTime() > Date.now())
        );
        // XG50 — 2º checkout concluído com um plano pago ativo (ex.: dois
        // checkouts abertos no teste e os dois pagos): a 2ª assinatura do
        // gateway nasceria cobrando junto. Cancela a nova no gateway.
        const duplicada = plano && atual && !elegivel && atual.provider !== TESTE_PROVIDER
          && atual.canceladaEm === null && atual.gatewaySubscriptionId !== (evt.gatewaySubscriptionId ?? null);
        if (duplicada && evt.gatewaySubscriptionId) {
          cancelarSubDoEvento = true;
          duplicadaDe = atual!.id;
        }
        if (plano && atual && elegivel) {
          if (atual.provider !== TESTE_PROVIDER && atual.gatewaySubscriptionId) gatewaySubIdsToCancel.push(atual.gatewaySubscriptionId);
          await tx.update(assinaturas).set({ status: "cancelada", canceladaEm: new Date() }).where(eq(assinaturas.id, atual.id));
          // 10/11/2026 — período sem cobrança além do acesso que a conta já
          // tinha (mês bônus do teste) só vale com o 1º pagamento. Marca o fim
          // do acesso devido para `acessoAteAoCancelar`. Vale também para um 2º
          // checkout aberto com bônus: a conta não ganha outro mês de graça.
          const periodoGratis = atual.renovaEm !== null
            && vencimento.getTime() > atual.renovaEm.getTime() + 24 * 60 * 60 * 1000;
          const gateway = getPaymentGateway();
          const [nova] = await tx.insert(assinaturas).values({
            userId,
            planoId: plano.id,
            persona: "xgestao",
            status: "ativa",
            ciclo: ciclo === "anual" ? "anual" : "mensal",
            renovaEm: vencimento,
            gatewayProvider: gateway.provider,
            gatewayCustomerId: evt.gatewayCustomerId ?? null,
            gatewaySubscriptionId: evt.gatewaySubscriptionId ?? null,
            fimTesteEm: periodoGratis ? atual.renovaEm : null,
            documentoFiscal: (await documentoDoUsuario(userId, tx)) ?? null,
          }).returning({ id: assinaturas.id });
          assinaturaId = nova.id;
          await restaurarAposNovaAssinatura(tx, userId, plano.tier);
          const [userRow] = await tx.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
          if (userRow) {
            notifPayload = { tipo: "checkout", userNome: userRow.name ?? "—", userEmail: userRow.email ?? "—", planoNome: plano.nome, ciclo: ciclo === "anual" ? "anual" : "mensal" };
          }
          const dataCobranca = vencimento.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
          void criarNotificacao({
            userId,
            tipo: "sucesso",
            titulo: `Plano ${plano.nome} ativado`,
            descricao: `Assinatura confirmada. A 1ª cobrança será em ${dataCobranca}; até lá, o plano ${plano.nome} já está valendo.`,
            href: null,
          }).catch(() => {
            // fire-and-forget: não bloqueia processamento do webhook
          });
          console.info(`[asaas] assinatura xgestão com 1ª cobrança futura: userId=${userId} assinaturaId=${nova.id}`);
        }
      }
    }

    if (!assinaturaId && (evt.type === "payment_succeeded" || evt.type === "subscription_activated") && evt.externalReference) {
      const parsed = parseExternalRef(evt.externalReference);
      if (parsed) {
        const { userId, planoId, ciclo } = parsed;
        const [plano] = await tx.select().from(planos).where(eq(planos.id, planoId)).limit(1);
        if (plano && plano.ativo) {
          const personaAssinatura: PlanoPersona | null =
            plano.persona === "ambos" ? null : plano.persona;
          if (!personaAssinatura) return { processed: false };
          // XG50 — pagamento de um 2º checkout com plano pago ativo (sem
          // cancelamento agendado): não substitui a assinatura que já vale nem
          // cobra em dobro dali para frente. A nova sai do gateway e, desde
          // 10/11/2026, o pagamento é estornado sozinho (ver estorno-duplicado.ts).
          if (personaAssinatura === "xgestao" && evt.gatewaySubscriptionId) {
            const [vigentePaga] = await tx
              .select({ id: assinaturas.id, sub: assinaturas.gatewaySubscriptionId })
              .from(assinaturas)
              .where(and(
                eq(assinaturas.userId, userId), eq(assinaturas.persona, "xgestao"), eq(assinaturas.status, "ativa"),
                ne(assinaturas.gatewayProvider, TESTE_PROVIDER), isNull(assinaturas.canceladaEm),
              ))
              .limit(1);
            if (vigentePaga && vigentePaga.sub !== evt.gatewaySubscriptionId) {
              cancelarSubDoEvento = true;
              duplicadaDe = vigentePaga.id;
              pagamentoDuplicado = true;
            }
          }
        }
        if (plano && plano.ativo && !pagamentoDuplicado) {
          const personaAssinatura = (plano.persona === "ambos" ? null : plano.persona) as PlanoPersona;
          // Teste que a assinatura nova substitui (CONFIRMED chegou antes do
          // PAYMENT_CREATED): o mês bônus continua marcado (XG50).
          const [testeAtivo] = personaAssinatura === "xgestao"
            ? await tx.select({ renovaEm: assinaturas.renovaEm }).from(assinaturas).where(and(
              eq(assinaturas.userId, userId), eq(assinaturas.persona, "xgestao"), eq(assinaturas.status, "ativa"),
              eq(assinaturas.gatewayProvider, TESTE_PROVIDER),
            )).limit(1)
            : [];
          // Cancela assinatura anterior (troca de plano). Os gatewaySubscriptionIds
          // são cancelados no gateway APÓS o commit (seguro: nova assinatura já
          // salva). PAG-06: no xgestão inclui inadimplente e pendente_reativacao,
          // senão a subscription antiga seguia cobrando no Asaas.
          gatewaySubIdsToCancel.push(...await substituirAssinaturasAnteriores(tx, userId, personaAssinatura));

          // XG50 — o período pago começa no vencimento da cobrança paga.
          const vencimentoPago = dataDoVencimento(evt.dueDate);
          const renova = somarMeses(vencimentoPago ?? new Date(), mesesDoCiclo(ciclo));
          const bonusDoTeste = testeAtivo?.renovaEm && vencimentoPago
            && vencimentoPago.getTime() > testeAtivo.renovaEm.getTime() + 24 * 60 * 60 * 1000
            ? testeAtivo.renovaEm : null;

          const gateway = getPaymentGateway();
          const [nova] = await tx
            .insert(assinaturas)
            .values({
              userId,
              planoId: plano.id,
              persona: personaAssinatura,
              status: "ativa",
              ciclo: (ciclo as "mensal" | "anual") ?? "mensal",
              renovaEm: renova,
              gatewayProvider: gateway.provider,
              gatewayCustomerId: evt.gatewayCustomerId ?? null,
              gatewaySubscriptionId: evt.gatewaySubscriptionId ?? evt.externalReference ?? null,
              ...(personaAssinatura === "xgestao" ? {
                primeiroPagamentoEm: new Date(),
                fimTesteEm: bonusDoTeste,
                documentoFiscal: (await documentoDoUsuario(userId, tx)) ?? null,
              } : {}),
            })
            .returning({ id: assinaturas.id });

          assinaturaId = nova.id;

          // O tier global atende apenas o marketplace legado.
          if (personaAssinatura !== "xgestao") {
            await tx
              .update(users)
              .set({ plano: plano.tier, planoStartedAt: new Date() })
              .where(eq(users.id, userId));
          } else {
            await restaurarAposNovaAssinatura(tx, userId, plano.tier);
          }

          // Lançamento no caixa (J09).
          const valorFinal = evt.valor ?? valorDoCiclo(plano, ciclo);
          if (personaAssinatura === "xgestao" && evt.paymentId) {
            // XG45 — no xgestão a chave é o pagamento: o RECEIVED que chega
            // depois do CONFIRMED cai no ramo de renovação e não pode somar de novo.
            await registrarMensalidadeXgestao(tx, { userId, planoId: plano.id, paymentId: evt.paymentId, valor: valorFinal, ciclo });
          } else if (valorFinal > 0) {
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

    if (cancelarSubDoEvento && duplicadaDe) {
      const [dona] = await tx.select({ userId: assinaturas.userId }).from(assinaturas).where(eq(assinaturas.id, duplicadaDe)).limit(1);
      donoDuplicada = dona?.userId ?? null;
      if (pagamentoDuplicado && evt.paymentId) {
        // Serializa CONFIRMED e RECEIVED do mesmo pagamento: só um estorna.
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`xgestao-estorno-duplicado:${evt.paymentId}`}))`);
        const historico = await historicoEstornoDuplicado(tx, evt.paymentId);
        estornarDuplicado = decidirEstornoDuplicado({ pagamentoConfirmado: true, paymentId: evt.paymentId, historico }) === "estornar";
      }
      await tx.insert(assinaturaEventos).values({
        assinaturaId: duplicadaDe,
        userId: dona?.userId ?? null,
        tipo: "assinatura_duplicada_cancelada",
        payloadJson: {
          gatewaySubscriptionId: evt.gatewaySubscriptionId ?? null,
          paymentId: evt.paymentId ?? null,
          valor: evt.valor ?? null,
          // Pagamento já feito na assinatura duplicada: precisa de estorno.
          estornarPagamento: pagamentoDuplicado,
          // 10/11/2026 — esta entrega tenta o estorno automático (claim).
          estornoAutomatico: estornarDuplicado,
        },
      });
    }

    await tx.insert(assinaturaEventos).values({
      assinaturaId,
      tipo: evt.type,
      gatewayEventId: evt.eventId,
      // PAG-03/PAG-04 — guarda qual pagamento foi apagado/estornado.
      // CRM-11 — `motivo` ('estorno' | 'chargeback') separa os dois no admin.
      payloadJson: evt.type === "payment_refunded"
        ? { paymentId: evt.paymentId ?? null, valor: evt.valor ?? null, motivo: evt.motivo ?? null }
        : evt.type === "payment_deleted"
          ? { paymentId: evt.paymentId ?? null, valor: evt.valor ?? null }
          : {},
    });
    return { processed: true };
  });

  // XG48 — fora da transação (chamada HTTP ao gateway); nunca lança.
  if (result.processed && sincronizarAssinaturaId) {
    await sincronizarCobrancaPendente(sincronizarAssinaturaId);
  }

  // XG50 — assinatura duplicada no gateway: sai já, antes de cobrar de novo.
  if (result.processed && cancelarSubDoEvento && evt.gatewaySubscriptionId) {
    try {
      await getPaymentGateway().cancelSubscription(evt.gatewaySubscriptionId);
    } catch (err) {
      console.warn("[webhook] falha ao cancelar assinatura duplicada no gateway:", err);
    }
    if (!pagamentoDuplicado) {
      try {
        const { logError } = await import("@/server/lib/logger");
        await logError("error", "[xgestao] assinatura duplicada cancelada no gateway antes da 1ª cobrança", {
          route: "webhooks.gateway",
          meta: { assinaturaId: duplicadaDe, gatewaySubscriptionId: evt.gatewaySubscriptionId, paymentId: evt.paymentId ?? null },
        });
      } catch {
        // registro de erro é melhor esforço
      }
    }
  }

  // 10/11/2026 — pagamento já feito na duplicada: estorno automático, fora da
  // transação (chamada HTTP ao gateway). Nunca lança.
  if (result.processed && estornarDuplicado && evt.paymentId) {
    await estornarPagamentoDuplicado({
      paymentId: evt.paymentId,
      userId: donoDuplicada,
      assinaturaValidaId: duplicadaDe,
      gatewaySubscriptionId: evt.gatewaySubscriptionId ?? null,
      valor: evt.valor ?? null,
    });
  }

  // Dispara notificação admin pós-commit (fire-and-forget).
  if (result.processed && notifPayload) {
    void dispararNotificacaoAssinaturaAdmin(notifPayload);
  }

  // Cancela a assinatura anterior no gateway pós-commit (fire-and-forget).
  // Feito APÓS o commit para garantir que a nova assinatura já foi persistida antes
  // de cancelar a anterior — elimina o risco de o usuário perder o plano atual
  // caso o checkout ou a criação da nova assinatura falhem.
  if (result.processed) {
    for (const subId of new Set(gatewaySubIdsToCancel)) {
      // A própria subscription do evento só sai daqui no estorno (PAG-04).
      if (subId === evt.gatewaySubscriptionId && evt.type !== "payment_refunded") continue;
      void getPaymentGateway()
        .cancelSubscription(subId)
        .catch((err) => {
          console.warn("[webhook] falha ao cancelar assinatura anterior no gateway:", err);
        });
    }
  }

  return result;
}

/** Histórico de estorno automático de um pagamento duplicado (ver estorno-duplicado.ts). */
async function historicoEstornoDuplicado(tx: Tx, paymentId: string) {
  const r = await tx.execute<{ estornado: number; tentativas: number; falhas: number }>(sql`
    SELECT
      count(*) FILTER (WHERE tipo = 'pagamento_duplicado_estornado')::int AS estornado,
      count(*) FILTER (WHERE tipo = 'assinatura_duplicada_cancelada' AND payload_json->>'estornoAutomatico' = 'true')::int AS tentativas,
      count(*) FILTER (WHERE tipo = 'pagamento_duplicado_estorno_falhou')::int AS falhas
    FROM assinatura_eventos
    WHERE tipo IN ('pagamento_duplicado_estornado', 'assinatura_duplicada_cancelada', 'pagamento_duplicado_estorno_falhou')
      AND payload_json->>'paymentId' = ${paymentId}
  `);
  const linha = r.rows[0];
  return {
    estornado: Number(linha?.estornado ?? 0) > 0,
    tentativas: Number(linha?.tentativas ?? 0),
    falhas: Number(linha?.falhas ?? 0),
  };
}

/**
 * 10/11/2026 — estorna o pagamento da assinatura duplicada pelo gateway e
 * registra o desfecho. Falha (ou gateway sem estorno) vira evento
 * `pagamento_duplicado_estorno_falhou` e alerta de erro para o admin estornar
 * no painel; a próxima entrega do webhook do mesmo pagamento tenta de novo.
 */
async function estornarPagamentoDuplicado(args: {
  paymentId: string;
  userId: string | null;
  assinaturaValidaId: string | null;
  gatewaySubscriptionId: string | null;
  valor: number | null;
}): Promise<void> {
  const payload = {
    paymentId: args.paymentId,
    gatewaySubscriptionId: args.gatewaySubscriptionId,
    valor: args.valor,
  };
  try {
    const gateway = getPaymentGateway();
    if (!gateway.refundPayment) throw new Error(`gateway ${gateway.provider} sem estorno automático`);
    await gateway.refundPayment(args.paymentId);
    await db.insert(assinaturaEventos).values({
      assinaturaId: args.assinaturaValidaId,
      userId: args.userId,
      tipo: "pagamento_duplicado_estornado",
      payloadJson: payload,
    });
    if (args.userId) {
      void criarNotificacao({
        userId: args.userId,
        tipo: "info",
        titulo: "Pagamento em dobro estornado",
        descricao: "Recebemos um segundo pagamento da sua assinatura e devolvemos o valor. Seu plano continua ativo normalmente.",
        href: null,
      }).catch(() => {
        // fire-and-forget
      });
    }
    console.info(`[xgestao] pagamento duplicado estornado: paymentId=${args.paymentId}`);
  } catch (err) {
    const erro = err instanceof Error ? err.message.slice(0, 300) : "erro desconhecido";
    try {
      await db.insert(assinaturaEventos).values({
        assinaturaId: args.assinaturaValidaId,
        userId: args.userId,
        tipo: "pagamento_duplicado_estorno_falhou",
        payloadJson: { ...payload, erro },
      });
    } catch (e) {
      console.error("[xgestao] falha ao registrar estorno duplicado que falhou:", e);
    }
    try {
      const { logError } = await import("@/server/lib/logger");
      await logError("error", "[xgestao] estorno automático do pagamento duplicado falhou: estornar no painel do gateway", {
        route: "webhooks.gateway",
        meta: { assinaturaId: args.assinaturaValidaId, gatewaySubscriptionId: args.gatewaySubscriptionId, paymentId: args.paymentId, erro },
      });
    } catch {
      // registro de erro é melhor esforço
    }
  }
}

/**
 * Vencimento do Asaas (`YYYY-MM-DD`, ou com hora) como meio-dia em São Paulo,
 * para a data não mudar de dia na conversão de fuso.
 */
export { ORIGEM_MENSALIDADE_XGESTAO };

/**
 * XG45 — cada pagamento confirmado de assinatura do xgestão vira uma entrada
 * paga no caixa, com o id do pagamento como chave (`uq_financeiro_origem`).
 * Antes só o 1º pagamento era registrado (chave = assinatura), e renovações e a
 * 1ª cobrança adiada pelo bônus nunca apareciam na receita. Sem id do pagamento
 * não registra: seria impossível não dobrar CONFIRMED + RECEIVED.
 */
async function registrarMensalidadeXgestao(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  args: { userId: string; planoId: string; paymentId?: string; valor?: number; ciclo?: string | null },
) {
  if (!args.paymentId) return;
  const [plano] = await tx
    .select({ nome: planos.nome, valorMensal: planos.valorMensal, valorAnual: planos.valorAnual, persona: planos.persona })
    .from(planos).where(eq(planos.id, args.planoId)).limit(1);
  if (!plano || plano.persona !== "xgestao") return;
  // XG50 — anual: um lançamento só, com o valor do ano.
  const anual = cicloDaAssinatura(args.ciclo) === "anual";
  const valor = args.valor ?? valorDoCiclo(plano, args.ciclo);
  if (!(valor > 0)) return;
  await criarLancamentoPlataforma({
    tipo: "entrada",
    descricao: `${anual ? "Anuidade" : "Mensalidade"} xgestão ${plano.nome}`,
    valor,
    categoria: "assinatura",
    status: "pago",
    origemTipo: ORIGEM_MENSALIDADE_XGESTAO,
    data: hojeSaoPaulo(),
    origemId: args.paymentId,
    pagadorUserId: args.userId,
    recebedorUserId: null,
    tx,
  });
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Encerra localmente as assinaturas anteriores da persona e devolve os ids de
 * gateway a cancelar depois do commit. Marketplace: só a `ativa` (como antes).
 * xgestão (PAG-06): também `inadimplente` e `pendente_reativacao`, para a nova
 * assinatura substituir a antiga e nenhuma subscription velha seguir cobrando.
 */
async function substituirAssinaturasAnteriores(tx: Tx, userId: string, persona: PlanoPersona): Promise<string[]> {
  const status: Array<typeof assinaturas.$inferSelect.status> = persona === "xgestao"
    ? ["ativa", "inadimplente", "pendente_reativacao"]
    : ["ativa"];
  const antigas = await tx
    .update(assinaturas)
    .set({ status: "cancelada", canceladaEm: new Date() })
    .where(and(
      eq(assinaturas.userId, userId),
      eq(assinaturas.persona, persona),
      inArray(assinaturas.status, status),
    ))
    .returning({ id: assinaturas.id, gatewaySubscriptionId: assinaturas.gatewaySubscriptionId, provider: assinaturas.gatewayProvider });
  if (persona === "xgestao") {
    // XG48 — troca pendente da assinatura substituída não vale mais.
    for (const antiga of antigas) await cancelarTrocasPendentes(tx, antiga.id, "assinatura_substituida");
  }
  return antigas
    .filter((a) => a.provider !== TESTE_PROVIDER && a.gatewaySubscriptionId)
    .map((a) => a.gatewaySubscriptionId!);
}

/**
 * XG50 — o pagamento já entrou no caixa (mensalidade com esse id). Serve para
 * reconhecer o RECEIVED ou o OVERDUE atrasados de um pagamento já tratado.
 */
async function pagamentoJaContado(tx: Tx, paymentId?: string): Promise<boolean> {
  if (!paymentId) return false;
  const [linha] = await tx.select({ id: financeiro.id }).from(financeiro)
    .where(and(eq(financeiro.origemTipo, ORIGEM_MENSALIDADE_XGESTAO), eq(financeiro.origemId, paymentId)))
    .limit(1);
  return Boolean(linha);
}

/** 1º pagamento confirmado da assinatura (idempotente). */
async function marcarPrimeiroPagamento(tx: Tx, assinaturaId: string) {
  await tx.update(assinaturas)
    .set({ primeiroPagamentoEm: new Date() })
    .where(and(eq(assinaturas.id, assinaturaId), isNull(assinaturas.primeiroPagamentoEm)));
}

/** 10/11/2026 — o mês bônus do teste vale uma única vez por conta. */
async function bonusDoTesteJaUsado(userId: string): Promise<boolean> {
  const [usada] = await db.select({ id: assinaturas.id }).from(assinaturas).where(and(
    eq(assinaturas.userId, userId),
    eq(assinaturas.persona, "xgestao"),
    isNotNull(assinaturas.fimTesteEm),
  )).limit(1);
  return Boolean(usada);
}

/**
 * PAG-04 — estorno/chargeback de mensalidade do xgestão: saída paga no caixa
 * da plataforma, chave = id do pagamento (idempotente entre as etapas do
 * estorno). Valor: o do evento, senão o da mensalidade registrada, senão o
 * preço do plano. Sem id do pagamento não registra (não teria chave).
 */
async function registrarEstornoMensalidadeXgestao(
  tx: Tx,
  args: { userId: string; planoId: string; paymentId?: string; valor?: number },
) {
  if (!args.paymentId) {
    console.warn(`[webhook] estorno xgestão sem paymentId — caixa não ajustado (userId=${args.userId})`);
    return;
  }
  const [plano] = await tx
    .select({ nome: planos.nome, valorMensal: planos.valorMensal, persona: planos.persona })
    .from(planos).where(eq(planos.id, args.planoId)).limit(1);
  if (!plano || plano.persona !== "xgestao") return;
  // Sem valor no evento: o da mensalidade/anuidade registrada (XG50).
  const [original] = await tx
    .select({ valor: financeiro.valor })
    .from(financeiro)
    .where(and(eq(financeiro.origemTipo, ORIGEM_MENSALIDADE_XGESTAO), eq(financeiro.origemId, args.paymentId)))
    .limit(1);
  const valor = args.valor ?? (original ? Number(original.valor) : Number(plano.valorMensal));
  if (!(valor > 0)) return;
  await criarLancamentoPlataforma({
    tipo: "saida",
    descricao: `Estorno mensalidade xgestão ${plano.nome}`,
    valor,
    categoria: "assinatura",
    status: "pago",
    origemTipo: ORIGEM_ESTORNO_MENSALIDADE_XGESTAO,
    data: hojeSaoPaulo(),
    origemId: args.paymentId,
    pagadorUserId: null,
    recebedorUserId: args.userId,
    tx,
  });
}

function dataDoVencimento(valor?: string): Date | null {
  const m = valor?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const data = new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00-03:00`);
  return Number.isNaN(data.getTime()) ? null : data;
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
