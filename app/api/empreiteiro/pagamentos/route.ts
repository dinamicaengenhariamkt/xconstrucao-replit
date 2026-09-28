import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiras, medicoes, obras, xgestaoMembros, xgestaoMembroObras } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listLancamentosEmpreiteiro, type LancamentoRow } from "@features/financeiro/lancamentos-service";
import { listarIdsObrasPermitidas, resolverEmpresaDoUsuario } from "@features/xgestao/equipe/server/access";

type MedicaoStatus = "recebido" | "aguardando_aprovacao" | "pendente" | "atrasado" | "rejeitado";

function statusToMedicao(s: LancamentoRow["status"]): MedicaoStatus | null {
  if (s === "pago") return "recebido";
  if (s === "pendente") return "pendente";
  if (s === "atrasado") return "atrasado";
  if (s === "cancelado") return "rejeitado";
  return null;
}

const MONTH_LABEL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function periodoFromIso(iso: string): string {
  const [y, m] = iso.split("-");
  const idx = Math.max(0, Math.min(11, Number(m) - 1));
  return `${MONTH_LABEL[idx]} ${y}`;
}

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro" && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  // Ver comentário em ./kpi/route.ts: `financeiro` só tem lançamento após a
  // medição ser aprovada, então medições pendentes (o estado
  // "aguardando_aprovacao") só existem em `medicoes`. Sem elas, o card KPI
  // linkava para `?status=aguardando_aprovacao` — um filtro que nunca casava.
  const resolvedEmpresa = await resolverEmpresaDoUsuario(guard.user.id);
  const [membershipRow] = await db
    .select({
      id: xgestaoMembros.id,
      empreiteiraId: xgestaoMembros.empreiteiraId,
      donoUserId: empreiteiras.userId,
      papel: xgestaoMembros.papel,
    })
    .from(xgestaoMembros)
    .innerJoin(empreiteiras, eq(empreiteiras.id, xgestaoMembros.empreiteiraId))
    .where(and(eq(xgestaoMembros.userId, guard.user.id), eq(xgestaoMembros.status, "ativo")))
    .limit(1);
  const membership = resolvedEmpresa ? membershipRow : undefined;
  const empresaXgestao = membership
    ? {
      empreiteiraId: membership.empreiteiraId,
      donoUserId: membership.donoUserId ?? guard.user.id,
      papel: membership.papel,
    }
    : resolvedEmpresa;
  const permitidas = membership
    ? membership.papel === "gestor"
      ? null
      : (await db.select({ obraId: xgestaoMembroObras.obraId })
        .from(xgestaoMembroObras)
        .where(and(
          eq(xgestaoMembroObras.membroId, membership.id),
          eq(xgestaoMembroObras.empreiteiraId, membership.empreiteiraId),
        ))).map((grant) => grant.obraId)
    : empresaXgestao
      ? await listarIdsObrasPermitidas(guard.user.id, empresaXgestao.empreiteiraId)
      : null;
  const obraIdsXgestao = empresaXgestao
    ? (await db.select({ id: obras.id }).from(obras).where(and(
      eq(obras.empreiteiraId, empresaXgestao.empreiteiraId),
      isNull(obras.clienteId),
      ...(permitidas === null ? [] : [inArray(obras.id, permitidas)]),
    ))).map((obra) => obra.id)
    : [];
  const isTeamMember = Boolean(membership);
  const medicaoScope = isTeamMember
    ? obraIdsXgestao.length ? inArray(medicoes.obraId, obraIdsXgestao) : sql`false`
    : empresaXgestao
      ? obraIdsXgestao.length
        ? or(eq(medicoes.empreiteiroId, guard.user.id), inArray(medicoes.obraId, obraIdsXgestao))
        : eq(medicoes.empreiteiroId, guard.user.id)
      : eq(medicoes.empreiteiroId, guard.user.id);
  const [lancamentosRaw, medicoesPendentes] = await Promise.all([
    listLancamentosEmpreiteiro(empresaXgestao?.donoUserId ?? guard.user.id),
    db
      .select({
        id: medicoes.id,
        obraId: medicoes.obraId,
        obraNome: obras.nome,
        numero: medicoes.numero,
        etapa: medicoes.etapa,
        descricao: medicoes.descricao,
        valor: medicoes.valor,
        createdAt: medicoes.createdAt,
      })
      .from(medicoes)
      .innerJoin(obras, eq(obras.id, medicoes.obraId))
      .where(and(medicaoScope, eq(medicoes.status, "pendente")))
      .orderBy(desc(medicoes.createdAt)),
  ]);
  // O dono conserva todo o histórico financeiro próprio (marketplace e
  // xgestão). Membros recebem apenas lançamentos das obras xgestão autorizadas.
  const lancamentos = isTeamMember
    ? lancamentosRaw.filter((l) => l.obraId && obraIdsXgestao.includes(l.obraId))
    : lancamentosRaw;

  // Numeração sequencial por obra (ordem cronológica).
  const byObra = new Map<string, number>();
  const sortedAsc = [...lancamentos].sort((a, b) => (a.data > b.data ? 1 : -1));
  const numeroById = new Map<string, number>();
  for (const l of sortedAsc) {
    const key = l.obraId || "_";
    const next = (byObra.get(key) ?? 0) + 1;
    byObra.set(key, next);
    numeroById.set(l.id, next);
  }

  const payload = lancamentos
    .map((l) => {
      const status = statusToMedicao(l.status);
      if (!status) return null;
      return {
        id: l.id,
        obraId: l.obraId ?? "",
        obraNome: l.obraNome ?? "(sem obra)",
        numero: numeroById.get(l.id) ?? 1,
        periodo: periodoFromIso(l.data),
        valor: l.valor,
        status,
        dataEnvio: l.data,
        dataRecebimento: l.dataPagamento ?? undefined,
        descricao: l.descricao,
      };
    })
    .filter(Boolean);

  // Medições aguardando decisão do contratante. `numero` vem do próprio registro
  // (sequencial por obra, atribuído no POST de /api/empreiteiro/medicoes).
  const aguardando = medicoesPendentes.map((m) => ({
    id: m.id,
    obraId: m.obraId,
    obraNome: m.obraNome ?? "(sem obra)",
    numero: m.numero,
    periodo: periodoFromIso(
      (m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt ?? "")).slice(0, 10),
    ),
    valor: Number(m.valor),
    status: "aguardando_aprovacao" as const,
    dataEnvio: (m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt ?? "")).slice(0, 10),
    dataRecebimento: undefined,
    descricao: m.descricao ?? m.etapa,
  }));

  const r = NextResponse.json([...aguardando, ...payload]);
  setNoCacheHeaders(r);
  return r;
}
