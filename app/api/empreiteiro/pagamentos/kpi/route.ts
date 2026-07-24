import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { medicoes } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listLancamentosEmpreiteiro } from "@features/financeiro/lancamentos-service";

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
  const [lancamentos, [aguardandoAgg]] = await Promise.all([
    listLancamentosEmpreiteiro(guard.user.id),
    db
      .select({ total: sql<string>`COALESCE(SUM(${medicoes.valor}), 0)` })
      .from(medicoes)
      .where(and(eq(medicoes.empreiteiroId, guard.user.id), eq(medicoes.status, "pendente"))),
  ]);

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
