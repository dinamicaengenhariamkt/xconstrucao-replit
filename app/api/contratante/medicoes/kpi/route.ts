import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getClienteIdForUser, listMedicoesForContratante } from "../_shared";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "contratante") {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const clienteId = await getClienteIdForUser(guard.user.id);
  const lista = clienteId ? await listMedicoesForContratante(clienteId) : [];

  const totalContratado = lista.reduce((acc, m) => acc + m.valor, 0);
  const aprovadasOuPagas = lista.filter((m) => m.status === "aprovada" || m.status === "paga");
  const totalAprovado = aprovadasOuPagas.reduce((acc, m) => acc + m.valor, 0);
  const aguardandoLista = lista.filter((m) => m.status === "aguardando_aprovacao");
  const aguardandoMinhaAprovacao = aguardandoLista.reduce((acc, m) => acc + m.valor, 0);
  const rejeitado = lista
    .filter((m) => m.status === "rejeitada")
    .reduce((acc, m) => acc + m.valor, 0);

  const avaliadas = lista.filter((m) => m.dataAvaliacao);
  const prazoMedioAvaliacaoDias = avaliadas.length === 0
    ? 0
    : Math.round(
        avaliadas.reduce((acc, m) => {
          const start = new Date(m.dataEnvio).getTime();
          const end = new Date(m.dataAvaliacao!).getTime();
          return acc + Math.round((end - start) / 86_400_000);
        }, 0) / avaliadas.length,
      );

  const r = NextResponse.json({
    totalContratado,
    totalAprovado,
    aguardandoMinhaAprovacao,
    rejeitado,
    countAguardando: aguardandoLista.length,
    prazoMedioAvaliacaoDias,
  });
  setNoCacheHeaders(r);
  return r;
}
