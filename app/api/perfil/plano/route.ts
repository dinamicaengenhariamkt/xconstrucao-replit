import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users, empreiteiras, clientes, obras, candidaturas, assinaturas, planos, xgestaoMembros } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import {
  getPlanCatalog,
  EMPREITEIRO_USAGE_LABELS,
  CONTRATANTE_USAGE_LABELS,
  XGESTAO_USAGE_LABELS,
  type PlanoTier,
  type PlanUsageItem,
} from "@shared/lib/plans-catalog";
import { assertXgestaoUser } from "@features/xgestao/lib/entitlement";
import { getEstadoTeste, type EstadoTeste } from "@features/xgestao/teste/server/teste-service";
import { planoDaEmpresa, situacaoPlanoXgestao } from "@features/xgestao/server/plano-empresa";
import { encerrarCancelamentosVencidos } from "@features/planos/assinatura-service";
import { acessoAteAoCancelar } from "@features/xgestao/lib/acesso-plano";
import { documentoXgestaoValido } from "@features/xgestao/lib/documento-fiscal";
import { resolverEmpresaDoUsuario } from "@features/xgestao/equipe/server/access";
import { consultarVagasEquipe } from "@features/xgestao/equipe/server/vagas-service";
import { trocaAgendadaDoUsuario } from "@features/xgestao/server/troca-marcas";
import { cicloDaAssinatura, valorDoCiclo } from "@features/xgestao/lib/ciclo-plano";
import { xgestaoAnualAtivo } from "@features/xgestao/server/anual";

async function computeEmpreiteiroUsage(userId: string): Promise<Record<string, number>> {
  const [emp] = await db.select().from(empreiteiras).where(eq(empreiteiras.userId, userId));
  const fotos = emp?.portfolioUrls?.length ?? 0;

  let obrasAtivas = 0;
  let contratosAtivos = 0;
  if (emp) {
    const rows = await db
      .select({ status: obras.status })
      .from(obras)
      .where(eq(obras.empreiteiraId, emp.id));
    for (const r of rows) {
      if (r.status === "em_andamento" || r.status === "planejamento" || r.status === "pausada") obrasAtivas++;
      if (r.status === "em_andamento") contratosAtivos++;
    }
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const propostasRows = await db
    .select({ id: candidaturas.id })
    .from(candidaturas)
    .where(and(eq(candidaturas.empreiteiroId, userId), gte(candidaturas.createdAt, startOfMonth)));
  const propostasMes = propostasRows.length;

  return { obrasAtivas, propostasMes, fotosPortfolio: fotos, contratosAtivos };
}

async function computeContratanteUsage(userId: string): Promise<Record<string, number>> {
  const [cli] = await db.select().from(clientes).where(eq(clientes.userId, userId));

  let obrasAbertas = 0;
  let contratosAtivos = 0;
  let empreiteirosContratados = 0;
  let propostasRecebidas = 0;
  if (cli) {
    const rows = await db
      .select({ id: obras.id, status: obras.status, empreiteiraId: obras.empreiteiraId })
      .from(obras)
      .where(eq(obras.clienteId, cli.id));
    const empSet = new Set<string>();
    const obraIds: string[] = [];
    for (const r of rows) {
      if (r.status !== "concluida") obrasAbertas++;
      if (r.status === "em_andamento") contratosAtivos++;
      if (r.empreiteiraId) empSet.add(r.empreiteiraId);
      obraIds.push(r.id);
    }
    empreiteirosContratados = empSet.size;
    if (obraIds.length) {
      const props = await db
        .select({ id: candidaturas.id })
        .from(candidaturas)
        .where(inArray(candidaturas.obraId, obraIds));
      propostasRecebidas = props.length;
    }
  }

  return { obrasAbertas, empreiteirosContratados, contratosAtivos, propostasRecebidas };
}

async function computeXGestaoUsage(userId: string): Promise<Record<string, number>> {
  const [emp] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, userId));
  if (!emp) return { obrasAtivas: 0 };
  const [{ obrasAtivas }] = await db
    .select({ obrasAtivas: sql<number>`COUNT(*)::int` })
    .from(obras)
    // XG48 — obra só para visualização pelo plano não ocupa vaga.
    .where(and(eq(obras.empreiteiraId, emp.id), isNull(obras.clienteId), sql`${obras.status} <> 'concluida'`, eq(obras.xgestaoBloqueadaPorPlano, false)));
  return { obrasAtivas };
}

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const [user] = await db
    .select({ id: users.id, role: users.role, plano: users.plano, planoStartedAt: users.planoStartedAt })
    .from(users)
    .where(eq(users.id, guard.user.id));

  if (!user) {
    const r = NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  if (user.role === "admin") {
    const r = NextResponse.json({ message: "Plano não aplicável ao perfil admin" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const requestedPersona = request.nextUrl.searchParams.get("persona");
  let persona: "empreiteiro" | "contratante" | "xgestao";
  if (requestedPersona === "xgestao") {
    const [membership] = await db
      .select({ id: xgestaoMembros.id })
      .from(xgestaoMembros)
      .where(and(eq(xgestaoMembros.userId, user.id), eq(xgestaoMembros.status, "ativo")));
    if (membership) {
      const r = NextResponse.json({ message: "O plano do xgestão é gerenciado pelo responsável da empresa." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
    const entitlement = await assertXgestaoUser(user.id);
    if (!entitlement) {
      const r = NextResponse.json({ message: "Acesso xgestão não autorizado." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
    persona = "xgestao";
  } else {
    if (requestedPersona) {
      const r = NextResponse.json({ message: "Persona inválida." }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
    persona = user.role === "empreiteiro" ? "empreiteiro" : "contratante";
  }
  let tier: PlanoTier = (user.plano as PlanoTier) ?? "free";
  // XG35 — calculado antes do tier: também grava o vencimento preguiçoso do teste.
  const teste: EstadoTeste | null = persona === "xgestao" ? await getEstadoTeste(user.id) : null;
  // XG43 — mesma regra de vigência da escrita (24h do teste, cancelamento
  // agendado e carência de inadimplência).
  let situacaoXgestao: Awaited<ReturnType<typeof situacaoPlanoXgestao>> | null = null;
  if (persona === "xgestao") {
    await encerrarCancelamentosVencidos(user.id);
    situacaoXgestao = await situacaoPlanoXgestao(user.id);
    tier = situacaoXgestao.tier ?? "free";
  }
  const catalogoFallback = getPlanCatalog(persona, tier);
  const [catalogoPersistido] = await db
    .select({
      nome: planos.nome,
      precoMensal: planos.valorMensal,
      features: planos.features,
    })
    .from(planos)
    .where(and(eq(planos.persona, persona), eq(planos.tier, tier), eq(planos.ativo, true)))
    .limit(1);
  let catalogo = catalogoPersistido
    ? {
        nome: catalogoPersistido.nome,
        precoMensal: Number(catalogoPersistido.precoMensal),
        features:
          persona === "xgestao" && tier === "free"
            ? catalogoFallback.features
            : catalogoPersistido.features,
        limites: catalogoFallback.limites,
      }
    : catalogoFallback;
  const empresaXgestao = persona === "xgestao" ? await resolverEmpresaDoUsuario(user.id) : null;
  const planoEmpresa = empresaXgestao ? await planoDaEmpresa(empresaXgestao.empreiteiraId) : null;
  const usoEquipe = empresaXgestao ? await consultarVagasEquipe(empresaXgestao.empreiteiraId) : null;
  if (planoEmpresa?.somenteLeitura) {
    catalogo = { nome: "Somente leitura", precoMensal: 0, features: ["Dados preservados", "Assine para retomar as edições"], limites: planoEmpresa.limites };
  }

  const usageMap =
    persona === "xgestao"
      ? await computeXGestaoUsage(user.id)
      : persona === "empreiteiro"
      ? await computeEmpreiteiroUsage(user.id)
      : await computeContratanteUsage(user.id);
  const labels =
    persona === "xgestao"
      ? XGESTAO_USAGE_LABELS
      : persona === "empreiteiro"
        ? EMPREITEIRO_USAGE_LABELS
        : CONTRATANTE_USAGE_LABELS;
  if (usoEquipe) usageMap.pessoasEmpresa = usoEquipe.utilizadas;

  const uso: PlanUsageItem[] = Object.entries(catalogo.limites)
    .filter(([key]) => persona !== "xgestao" || key in XGESTAO_USAGE_LABELS)
    .map(([key, max]) => ({
    key,
    label: labels[key] ?? key,
    current: usageMap[key] ?? 0,
    max,
  }));

  // Busca status e data de renovação da assinatura ativa, se houver.
  let assinaturaStatus: string | null = null;
  let renovaEm: string | null = null;
  if (situacaoXgestao) {
    const lida = situacaoXgestao.tier ? situacaoXgestao.assinatura : null;
    assinaturaStatus = lida?.status ?? null;
    renovaEm = lida?.renovaEm?.toISOString() ?? null;
  } else if (tier !== "free") {
    const [ass] = await db
      .select({ status: assinaturas.status, renovaEm: assinaturas.renovaEm })
      .from(assinaturas)
        .where(and(
          eq(assinaturas.userId, user.id),
          eq(assinaturas.status, "ativa"),
          eq(assinaturas.persona, persona),
        ))
      .limit(1);
    if (ass) {
      assinaturaStatus = ass.status;
      renovaEm = ass.renovaEm?.toISOString() ?? null;
    } else {
      // Pode estar inadimplente ou cancelada
      const [assAny] = await db
        .select({ status: assinaturas.status, renovaEm: assinaturas.renovaEm })
        .from(assinaturas)
        .where(and(eq(assinaturas.userId, user.id), eq(assinaturas.persona, persona)))
        .limit(1);
      if (assAny) {
        assinaturaStatus = assAny.status;
        renovaEm = assAny.renovaEm?.toISOString() ?? null;
      }
    }
  }

  // Verifica se o usuário tem CPF/CNPJ cadastrado (necessário para assinar).
  let hasCpfCnpj = false;
  if (persona === "xgestao") {
    // PAG-14 — mesma regra do checkout: CPF ou CNPJ válido, da empresa ou da conta.
    const [emp] = await db
      .select({ cnpj: empreiteiras.cnpj })
      .from(empreiteiras)
      .where(eq(empreiteiras.userId, user.id))
      .limit(1);
    const [doc] = await db.select({ cpfCnpj: users.cpfCnpj }).from(users).where(eq(users.id, user.id)).limit(1);
    hasCpfCnpj = Boolean(documentoXgestaoValido(emp?.cnpj, doc?.cpfCnpj));
  } else if (persona === "empreiteiro") {
    const [emp] = await db
      .select({ cnpj: empreiteiras.cnpj })
      .from(empreiteiras)
      .where(eq(empreiteiras.userId, user.id))
      .limit(1);
    hasCpfCnpj = Boolean(emp?.cnpj?.trim());
  } else {
    const [cli] = await db
      .select({ cnpjCpf: clientes.cnpjCpf })
      .from(clientes)
      .where(eq(clientes.userId, user.id))
      .limit(1);
    hasCpfCnpj = Boolean(cli?.cnpjCpf?.trim());
  }

  // XG48 — descida de plano agendada (aplicada sozinha na data efetiva).
  let trocaAgendada: { planoParaId: string; tierPara: string; nomePara: string; valorPara: number; efetivaEm: string } | null = null;
  if (situacaoXgestao) {
    const agendada = await trocaAgendadaDoUsuario(db, user.id);
    if (agendada) {
      const [planoPara] = await db.select({ nome: planos.nome }).from(planos).where(eq(planos.id, agendada.planoParaId)).limit(1);
      trocaAgendada = {
        planoParaId: agendada.planoParaId,
        tierPara: agendada.tierPara,
        nomePara: planoPara?.nome ?? agendada.tierPara,
        valorPara: Number(agendada.valorPara),
        efetivaEm: agendada.efetivaEm.toISOString(),
      };
    }
  }

  // XG50 — cobrança da assinatura paga que vale: ciclo, valor do ciclo (anual
  // inteiro no anual) e diferença proporcional de subida ainda não paga, que
  // entra somada na próxima fatura (XG48).
  let cobranca: { ciclo: "mensal" | "anual"; valor: number; diferencaPendente: number; proximaEm: string | null; primeiraCobranca: boolean } | null = null;
  if (situacaoXgestao?.tier && situacaoXgestao.assinatura && situacaoXgestao.assinatura.provider !== "trial") {
    const [linha] = await db
      .select({ ciclo: assinaturas.ciclo, valorMensal: planos.valorMensal, valorAnual: planos.valorAnual })
      .from(assinaturas).innerJoin(planos, eq(planos.id, assinaturas.planoId))
      .where(eq(assinaturas.id, situacaoXgestao.assinatura.id)).limit(1);
    if (linha) {
      const pendente = await db.execute<{ total: string | null }>(sql`
        SELECT COALESCE(SUM(valor_diferenca), 0)::text AS total FROM assinatura_trocas
         WHERE assinatura_id = ${situacaoXgestao.assinatura.id} AND tipo = 'subir' AND status = 'aplicada' AND quitada_em IS NULL
      `).catch(() => ({ rows: [{ total: "0" }] }));
      const agendadaValor = trocaAgendada ? trocaAgendada.valorPara : null;
      cobranca = {
        ciclo: cicloDaAssinatura(linha.ciclo),
        valor: agendadaValor ?? valorDoCiclo(linha, linha.ciclo),
        diferencaPendente: Number((pendente.rows[0] as { total: string | null } | undefined)?.total ?? 0),
        // Cancelada: não há próxima cobrança.
        proximaEm: situacaoXgestao.assinatura.canceladaEm ? null : situacaoXgestao.assinatura.renovaEm?.toISOString() ?? null,
        // Assinou no teste (ou voltou no período pago) e ainda não pagou nada.
        primeiraCobranca: !situacaoXgestao.assinatura.primeiroPagamentoEm,
      };
    }
  }

  const response = NextResponse.json({
    persona,
    plano: tier,
    planoStartedAt: user.planoStartedAt,
    assinaturaStatus,
    renovaEm,
    catalogo,
    uso,
    hasCpfCnpj,
    ...(planoEmpresa ? {
      somenteLeitura: planoEmpresa.somenteLeitura,
      usoEquipe,
    } : {}),
    ...(situacaoXgestao ? {
      // XG43 — assinatura paga cancelada que segue valendo até o fim do período pago.
      cancelamentoAgendado: Boolean(
        situacaoXgestao.tier && situacaoXgestao.assinatura?.provider !== "trial"
        && situacaoXgestao.assinatura?.status === "ativa" && situacaoXgestao.assinatura?.canceladaEm,
      ),
      inadimplente: Boolean(situacaoXgestao.tier && situacaoXgestao.assinatura?.status === "inadimplente"),
      // XG48 — assinatura paga vigente: trocar de plano é "Mudar para este plano"
      // (sem checkout). Teste sem assinatura e conta somente leitura assinam.
      assinaturaPaga: Boolean(
        situacaoXgestao.tier && situacaoXgestao.assinatura?.provider !== "trial"
        && (situacaoXgestao.assinatura?.status === "ativa" || situacaoXgestao.assinatura?.status === "inadimplente"),
      ),
      trocaAgendada,
      cobranca,
      // XG50 — anual preparado e desligado: só aparece com a chave ligada.
      anualDisponivel: await xgestaoAnualAtivo(),
      // Regra de 10/11/2026: até quando o acesso vale se cancelar agora (o mês
      // bônus sem 1º pagamento encurta). Usado no texto do diálogo de cancelamento.
      acessoSeCancelar: situacaoXgestao.tier && situacaoXgestao.assinatura
        && situacaoXgestao.assinatura.provider !== "trial" && situacaoXgestao.assinatura.status === "ativa"
        ? acessoAteAoCancelar(situacaoXgestao.assinatura)?.toISOString() ?? null
        : null,
    } : {}),
    ...(teste ? { teste } : {}),
  });
  setNoCacheHeaders(response);
  return response;
}
