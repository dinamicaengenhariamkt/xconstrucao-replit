import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users, empreiteiras, clientes, obras, candidaturas, assinaturas, planos } from "@shared/db/schema";
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
    .where(and(eq(obras.empreiteiraId, emp.id), isNull(obras.clienteId), sql`${obras.status} <> 'concluida'`));
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
  if (persona === "xgestao") {
    const [assinaturaXGestao] = await db
      .select({ tier: planos.tier })
      .from(assinaturas)
      .innerJoin(planos, eq(planos.id, assinaturas.planoId))
      .where(and(
        eq(assinaturas.userId, user.id),
        eq(assinaturas.persona, "xgestao"),
        eq(assinaturas.status, "ativa"),
      ))
      .limit(1);
    tier = (assinaturaXGestao?.tier as PlanoTier | undefined) ?? "free";
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
  const catalogo = catalogoPersistido
    ? {
        nome: catalogoPersistido.nome,
        precoMensal: Number(catalogoPersistido.precoMensal),
        features: catalogoPersistido.features,
        limites: catalogoFallback.limites,
      }
    : catalogoFallback;

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

  const uso: PlanUsageItem[] = Object.entries(catalogo.limites).map(([key, max]) => ({
    key,
    label: labels[key] ?? key,
    current: usageMap[key] ?? 0,
    max,
  }));

  // Busca status e data de renovação da assinatura ativa, se houver.
  let assinaturaStatus: string | null = null;
  let renovaEm: string | null = null;
  if (tier !== "free") {
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
  if (persona === "empreiteiro" || persona === "xgestao") {
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

  const response = NextResponse.json({
    persona,
    plano: tier,
    planoStartedAt: user.planoStartedAt,
    assinaturaStatus,
    renovaEm,
    catalogo,
    uso,
    hasCpfCnpj,
  });
  setNoCacheHeaders(response);
  return response;
}
