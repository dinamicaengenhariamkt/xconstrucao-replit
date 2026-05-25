import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listLancamentosEmpreiteiro, type LancamentoRow } from "@features/financeiro/lancamentos-service";

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

  const lancamentos = await listLancamentosEmpreiteiro(guard.user.id);

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

  const r = NextResponse.json(payload);
  setNoCacheHeaders(r);
  return r;
}
