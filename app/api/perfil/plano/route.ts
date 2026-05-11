import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users, empreiteiras, clientes, obras, candidaturas } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import {
  getPlanCatalog,
  EMPREITEIRO_USAGE_LABELS,
  CONTRATANTE_USAGE_LABELS,
  type PlanoTier,
  type PlanUsageItem,
} from "@shared/lib/plans-catalog";

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

  const persona: "empreiteiro" | "contratante" = user.role === "empreiteiro" ? "empreiteiro" : "contratante";
  const tier: PlanoTier = (user.plano as PlanoTier) ?? "free";
  const catalogo = getPlanCatalog(persona, tier);

  const usageMap =
    persona === "empreiteiro"
      ? await computeEmpreiteiroUsage(user.id)
      : await computeContratanteUsage(user.id);
  const labels = persona === "empreiteiro" ? EMPREITEIRO_USAGE_LABELS : CONTRATANTE_USAGE_LABELS;

  const uso: PlanUsageItem[] = Object.entries(catalogo.limites).map(([key, max]) => ({
    key,
    label: labels[key] ?? key,
    current: usageMap[key] ?? 0,
    max,
  }));

  const response = NextResponse.json({
    persona,
    plano: tier,
    planoStartedAt: user.planoStartedAt,
    catalogo,
    uso,
  });
  setNoCacheHeaders(response);
  return response;
}
