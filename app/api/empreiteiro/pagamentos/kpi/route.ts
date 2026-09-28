import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiras, medicoes, obras, xgestaoMembros, xgestaoMembroObras } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listLancamentosEmpreiteiro } from "@features/financeiro/lancamentos-service";
import { listarIdsObrasPermitidas, resolverEmpresaDoUsuario } from "@features/xgestao/equipe/server/access";

function diffDays(a: string, b: string): number {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  return Math.round((tb - ta) / 86_400_000);
}

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro" && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  // Duas fontes distintas, por desenho do fluxo (J40 P0 #2):
  //  - `financeiro` só recebe lançamento DEPOIS da medição ser aprovada
  //    (`criarLancamentoFromMedicao`), então medição pendente não existe lá;
  //  - `medicoes` é a fonte com o estado real de "aguardando aprovação" — a
  //    mesma que o contratante lê. Antes este KPI era `0` fixo, e o empreiteiro
  //    via R$ 0 enquanto o contratante via a medição pendente na tela dele.
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
  const [lancamentosRaw, [aguardandoAgg]] = await Promise.all([
    listLancamentosEmpreiteiro(empresaXgestao?.donoUserId ?? guard.user.id),
    db
      .select({ total: sql<string>`COALESCE(SUM(${medicoes.valor}), 0)` })
      .from(medicoes)
      .where(and(medicaoScope, eq(medicoes.status, "pendente"))),
  ]);
  // Donos veem seu histórico completo; membros ficam restritos às obras
  // xgestão da empresa filtradas acima por empresa, clienteId nulo e grants.
  const lancamentos = isTeamMember
    ? lancamentosRaw.filter((l) => l.obraId && obraIdsXgestao.includes(l.obraId))
    : lancamentosRaw;

  const aguardandoAprovacao = Number(aguardandoAgg?.total ?? 0);

  let totalContratado = 0;
  let totalRecebido = 0;
  let aLiberar = 0;
  let rejeitado = 0;
  const prazos: number[] = [];
  let medicoesRejeitadasCount = 0;
  let medicoesEnviadasCount = 0;

  for (const l of lancamentos) {
    if (l.status === "cancelado") {
      rejeitado += l.valor;
      medicoesRejeitadasCount += 1;
      medicoesEnviadasCount += 1;
      continue;
    }
    totalContratado += l.valor;
    medicoesEnviadasCount += 1;
    if (l.status === "pago") {
      totalRecebido += l.valor;
      if (l.dataPagamento) {
        prazos.push(diffDays(l.data, l.dataPagamento));
      }
    } else {
      aLiberar += l.valor;
    }
  }

  const prazoMedioRecebimentoDias = prazos.length === 0
    ? 0
    : Math.round(prazos.reduce((a, b) => a + b, 0) / prazos.length);
  const taxaRejeicaoPercent = medicoesEnviadasCount === 0
    ? 0
    : Math.round((medicoesRejeitadasCount / medicoesEnviadasCount) * 100);

  const r = NextResponse.json({
    totalContratado,
    totalRecebido,
    aguardandoAprovacao,
    aLiberar,
    rejeitado,
    prazoMedioRecebimentoDias,
    medicoesRejeitadasCount,
    medicoesEnviadasCount,
    taxaRejeicaoPercent,
  });
  setNoCacheHeaders(r);
  return r;
}
