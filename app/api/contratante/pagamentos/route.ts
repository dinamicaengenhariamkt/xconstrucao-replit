import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listLancamentosContratante, type LancamentoRow } from "@features/financeiro/lancamentos-service";

function statusToContratante(s: LancamentoRow["status"]): "pago" | "pendente" | "atrasado" | "agendado" {
  if (s === "cancelado") return "pendente";
  return s;
}

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
  const payload = lancamentos
    .filter((l) => l.status !== "cancelado")
    .map((l) => {
      let status = statusToContratante(l.status);
      // Marcar atrasado em tempo de leitura quando passou da data de vencimento.
      if (status === "pendente" && l.dataVencimento && l.dataVencimento < today) {
        status = "atrasado";
      }
      return {
        id: l.id,
        descricao: l.descricao,
        obraId: l.obraId ?? "",
        obraNome: l.obraNome ?? "(sem obra)",
        valor: l.valor,
        tipo: l.tipo === "entrada" ? "entrada" : "saida",
        data: l.dataVencimento || l.data,
        status,
        categoria: l.categoria ?? "Outros",
        metodoPagamento: l.metodoPagamento ?? "",
      };
    });

  const r = NextResponse.json(payload);
  setNoCacheHeaders(r);
  return r;
}
