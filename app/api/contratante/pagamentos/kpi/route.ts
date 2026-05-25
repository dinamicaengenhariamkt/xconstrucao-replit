import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listLancamentosContratante } from "@features/financeiro/lancamentos-service";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "contratante" && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const lancamentos = await listLancamentosContratante(guard.user.id);
  const today = new Date().toISOString().slice(0, 10);

  let totalEntradas = 0;
  let totalSaidas = 0;
  let pendentes = 0;
  let totalContratado = 0;

  for (const l of lancamentos) {
    if (l.status === "cancelado") continue;
    totalContratado += l.valor;
    if (l.status === "pago") {
      if (l.tipo === "entrada") totalEntradas += l.valor;
      else totalSaidas += l.valor;
    } else if (l.status === "pendente" || l.status === "atrasado") {
      pendentes += l.valor;
      if (l.dataVencimento && l.dataVencimento < today) {
        // mantém em pendentes; só sinalização
      }
    }
  }

  const r = NextResponse.json({
    totalEntradas,
    totalSaidas,
    saldo: totalEntradas - totalSaidas,
    pendentes,
    totalContratado,
  });
  setNoCacheHeaders(r);
  return r;
}
