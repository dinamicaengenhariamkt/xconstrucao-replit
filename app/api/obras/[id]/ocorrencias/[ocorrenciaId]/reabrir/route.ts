import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obraOcorrencias } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess } from "@features/obras/api/access";
import { podeGerenciarOcorrencia } from "@features/obras/api/ocorrencia-schemas";
import { papelGestaoOcorrencias } from "@features/obras/api/ocorrencia-acesso";

function resposta(body: unknown, status = 200) {
  const r = NextResponse.json(body, { status });
  setNoCacheHeaders(r);
  return r;
}

/**
 * Devolve uma ocorrência resolvida para "aberta". Só na obra própria do
 * xgestão, pelo autor, dono ou gestor. A resolução descartada (quem, quando e
 * a observação) fica na auditoria.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string; ocorrenciaId: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, ocorrenciaId } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) return resposta({ message: "Obra não encontrada" }, 404);
  const papel = await papelGestaoOcorrencias(access, guard.user.id);
  if (papel === undefined) return resposta({ message: "Sem permissão." }, 403);
  const [atual] = await db.select().from(obraOcorrencias)
    .where(and(eq(obraOcorrencias.id, ocorrenciaId), eq(obraOcorrencias.obraId, id)));
  if (!atual) return resposta({ message: "Ocorrência não encontrada" }, 404);
  if (!podeGerenciarOcorrencia(guard.user.id, atual.autorId, papel)) {
    return resposta({ message: "Sem permissão." }, 403);
  }
  // Atômico: dois cliques não reabrem duas vezes nem apagam uma resolução nova.
  const [updated] = await db.update(obraOcorrencias)
    .set({
      status: "aberta",
      resolvidoPorId: null,
      resolvidoEm: null,
      observacaoResolucao: null,
      atualizadoEm: new Date(),
    })
    .where(and(
      eq(obraOcorrencias.id, ocorrenciaId),
      eq(obraOcorrencias.obraId, id),
      eq(obraOcorrencias.status, "resolvida"),
    ))
    .returning();
  if (!updated) return resposta({ error: "ALREADY_OPEN", message: "Ocorrência já estava aberta." }, 409);
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.ocorrencia.reabrir",
    payload: {
      obraId: id,
      ocorrenciaId,
      resolvidoPorIdAnterior: atual.resolvidoPorId,
      resolvidoEmAnterior: atual.resolvidoEm,
      observacaoResolucaoAnterior: atual.observacaoResolucao,
    },
    request,
  });
  return resposta(updated);
}
