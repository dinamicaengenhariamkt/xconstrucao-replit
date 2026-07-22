import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listLancamentosContratante, type LancamentoRow } from "@features/financeiro/lancamentos-service";
import { filtrarRecebedoresAptos } from "@features/marketplace/split-service";

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

  // J47 — quais recebedores estão aptos a receber via split (subconta aprovada).
  // Uma query só para todos os recebedores de lançamentos ainda não pagos.
  const recebedores = Array.from(
    new Set(
      lancamentos
        .filter((l) => l.status !== "pago" && l.status !== "cancelado" && l.recebedorUserId)
        .map((l) => l.recebedorUserId as string),
    ),
  );
  const aptos = await filtrarRecebedoresAptos(recebedores);

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
        // J47 — só true quando o pagamento pode ser feito via plataforma (split).
        splitElegivel: status !== "pago" && !!l.recebedorUserId && aptos.has(l.recebedorUserId),
      };
    });

  const r = NextResponse.json(payload);
  setNoCacheHeaders(r);
  return r;
}
